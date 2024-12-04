const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');

const app = express();
app.use(bodyParser.json());

let menu = [];
let orders = [];
let orderStatusQueue = [];

app.post('/menu', (req, res) => {
    const { name, price, category } = req.body;
    if (!name || price <= 0 || !category) {
        return res.status(400).send('Invalid menu item data.');
    }
    menu.push({ id: menu.length + 1, name, price, category });
    res.status(201).send('Menu item added.');
});

app.get('/menu', (req, res) => {
    res.status(200).json(menu);
});

app.post('/orders', (req, res) => {
    const { items } = req.body;
    const validItems = items.every(itemId => menu.some(menuItem => menuItem.id === itemId));
    if (!validItems) {
        return res.status(400).send('Invalid order items.');
    }
    const orderId = orders.length + 1;
    orders.push({ id: orderId, items, status: 'Preparing' });
    orderStatusQueue.push({ orderId, status: 'Out for Delivery', delay: 5 });
    orderStatusQueue.push({ orderId, status: 'Delivered', delay: 10 });
    res.status(201).send({ orderId });
});

app.get('/orders/:id', (req, res) => {
    const order = orders.find(o => o.id == req.params.id);
    if (!order) {
        return res.status(404).send('Order not found.');
    }
    res.status(200).json(order);
});

cron.schedule('* * * * *', () => {
    orderStatusQueue.forEach((task, index) => {
        task.delay -= 1;
        if (task.delay <= 0) {
            const order = orders.find(o => o.id === task.orderId);
            if (order) {
                order.status = task.status;
            }
            orderStatusQueue.splice(index, 1);
        }
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});