import { prisma } from './services/db';
import { sendMessage } from './services/twilio';
import { 
    getUserState, 
    setUserState, 
    addToCart, 
    getCart, 
    clearCart, 
    setContext, 
    getContext, 
    UserState 
} from './services/redis';

export async function handleIncomingMessage(from: string, body: string) {
    let text = body.trim().toLowerCase();

    // GLOBAL RESET INTERCEPTOR
    if (text === 'hi' || text === 'hello' || text === 'menu' || text === 'restart') {
        await setUserState(from, UserState.IDLE);
    }

    const currentState = await getUserState(from);

    let user = await prisma.user.findUnique({ where: { phone: from } });
    if (!user) user = await prisma.user.create({ data: { phone: from } });

    switch (currentState) {
        case UserState.IDLE:
            await sendMessage(from, 
                "Welcome to our store! 🏪\n\n" +
                "Reply *1* to Browse the Menu 📚\n" +
                "Reply *2* to View Cart & Checkout 🛒\n" +
                "Reply *3* to View Order History 📦"
            );
            await setUserState(from, UserState.AWAITING_MAIN_MENU_SELECTION);
            break;

        case UserState.AWAITING_MAIN_MENU_SELECTION:
            if (text === '1' || text === 'browse menu') {
                const categories = await prisma.category.findMany();
                let msg = "📚 *Product Categories* 📚\n\nReply with the category number or name:\n";
                categories.forEach(c => msg += `*${c.id}* - ${c.name}\n`);
                await sendMessage(from, msg);
                await setUserState(from, UserState.AWAITING_CATEGORY_SELECTION);

            } else if (text === '2' || text === 'view cart' || text === 'checkout') {
                const cart = await getCart(from);
                if (!cart.length) {
                    await sendMessage(from, "🛒 Your cart is completely empty! Reply *1* to look at our menu.");
                    await setUserState(from, UserState.IDLE);
                    return;
                }

                let cartMsg = "🛒 *Your Current Cart* 🛒\n\n";
                let grandTotal = 0;

                // Build itemized list and calculate totals
                for (const item of cart) {
                    const variant = await prisma.productVariant.findUnique({
                        where: { id: item.variantId },
                        include: { product: true }
                    });
                    if (variant) {
                        const itemTotal = variant.price * item.quantity;
                        grandTotal += itemTotal;
                        cartMsg += `• ${item.quantity}x *${variant.product.name}* (${variant.size}) - $${itemTotal.toFixed(2)}\n`;
                    }
                }

                cartMsg += `\n*Grand Total: $${grandTotal.toFixed(2)}*\n\n`;
                cartMsg += "Reply *1* to Place Order (Checkout) 🚀\nReply *2* to Clear Cart & Start Over ❌";
                
                await sendMessage(from, cartMsg);
                await setUserState(from, UserState.AWAITING_CART_CONFIRMATION);

            } else if (text === '3' || text === 'order history') {
                const orders = await prisma.order.findMany({ 
                    where: { userId: user.id }, 
                    take: 3, 
                    orderBy: { createdAt: 'desc' },
                    include: { items: { include: { variant: { include: { product: true } } } } }
                });

                if (!orders.length) {
                    await sendMessage(from, "📦 You have no historical orders placed with us yet.");
                } else {
                    let msg = "📦 *Your Recent Orders:*\n\n";
                    orders.forEach(o => {
                        msg += `*Order #${o.id}* | Status: ${o.status}\n`;
                        o.items.forEach(i => msg += `  - ${i.quantity}x ${i.variant.product.name}\n`);
                        msg += `-----------\n`;
                    });
                    await sendMessage(from, msg);
                }
                await setUserState(from, UserState.IDLE);
            } else {
                await sendMessage(from, "❌ Invalid choice. Please reply *1*, *2*, or *3*.");
            }
            break;

        case UserState.AWAITING_CATEGORY_SELECTION:
            const categories = await prisma.category.findMany();
            let chosenCategory = categories.find(c => c.id === parseInt(text) || c.name.toLowerCase() === text);

            if (!chosenCategory) {
                return await sendMessage(from, "❌ Category not found. Please type the valid list number or name.");
            }
            
            const products = await prisma.product.findMany({ 
                where: { categoryId: chosenCategory.id }, 
                include: { variants: true } 
            });
            
            await setContext(from, 'selectedCategoryId', chosenCategory.id.toString());
            
            let pMsg = `🛒 *Available Items in ${chosenCategory.name}* 🛒\n\nReply with the item number or name:\n`;
            products.forEach((p, idx) => {
                pMsg += `*${idx + 1}* - ${p.name} ($${p.variants[0].price})\n`;
            });
            
            await sendMessage(from, pMsg);
            await setUserState(from, UserState.AWAITING_PRODUCT_SELECTION);
            break;

        case UserState.AWAITING_PRODUCT_SELECTION:
            const savedCategoryIdStr = await getContext(from, 'selectedCategoryId');
            const currentProducts = await prisma.product.findMany({
                where: { categoryId: parseInt(savedCategoryIdStr || '0') },
                include: { variants: true }
            });

            const pIdx = parseInt(text) - 1;
            let chosenProduct = (!isNaN(pIdx) && pIdx >= 0 && pIdx < currentProducts.length) 
                ? currentProducts[pIdx] 
                : currentProducts.find(p => p.name.toLowerCase() === text);

            if (!chosenProduct) {
                return await sendMessage(from, "❌ Item not found. Please select from the available menu options.");
            }

            await setContext(from, 'selectedVariant', chosenProduct.variants[0].id.toString());
            await sendMessage(from, `How many units of *${chosenProduct.name}* would you like to add?`);
            await setUserState(from, UserState.AWAITING_QUANTITY);
            break;

        case UserState.AWAITING_QUANTITY:
            const qty = parseInt(text);
            if (isNaN(qty) || qty <= 0) {
                return await sendMessage(from, "❌ Please write a valid quantity number.");
            }
            
            const variantIdStr = await getContext(from, 'selectedVariant');
            if (variantIdStr) {
                const variant = await prisma.productVariant.findUnique({ 
                    where: { id: parseInt(variantIdStr) },
                    include: { product: true }
                });
                
                if (variant) {
                    await addToCart(from, { variantId: variant.id, quantity: qty, price: variant.price });
                    await sendMessage(from, `✅ Added *${qty}x ${variant.product.name}* to your cart!\n\nReply *hi* to open your management dashboard.`);
                    await setUserState(from, UserState.IDLE);
                }
            }
            break;

        case UserState.AWAITING_CART_CONFIRMATION:
            if (text === '1' || text === 'place order' || text === 'checkout') {
                const cart = await getCart(from);
                
                // 1. Write the Order record securely into PostgreSQL
                const newOrder = await prisma.order.create({
                    data: {
                        userId: user.id,
                        status: 'PENDING',
                        items: {
                            create: cart.map(item => ({
                                variantId: item.variantId,
                                quantity: item.quantity,
                                price: item.price
                            }))
                        }
                    }
                });

                // 2. Clear Redis cache storage 
                await clearCart(from);

                await sendMessage(from, `🎉 *Success!* Your order has been placed.\n\n*Order ID:* #${newOrder.id}\n*Status:* PENDING\n\nReply 'hi' to return to the menu.`);
                await setUserState(from, UserState.IDLE);
            } else if (text === '2' || text === 'clear cart') {
                await clearCart(from);
                await sendMessage(from, "❌ Your cart has been emptied. Reply 'hi' to start fresh.");
                await setUserState(from, UserState.IDLE);
            } else {
                await sendMessage(from, "❌ Invalid input. Reply *1* to Checkout or *2* to Clear Cart.");
            }
            break;

        default:
            await sendMessage(from, "Let's restart our pipeline session. Reply 'Hi'.");
            await setUserState(from, UserState.IDLE);
            break;
    }
}
