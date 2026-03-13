require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord');
const { Client, GatewayIntentBits, ChannelType, ThreadAutoArchiveDuration } = require('discord.js');
const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const rateLimit = require('express-rate-limit');

const app = express();

// Database connection pool
let pool;

async function initDatabase() {
    try {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        console.log('Connected to MySQL database');
        
        const connection = await pool.getConnection();
        connection.release();
        console.log('Database connection pool created');
    } catch (error) {
        console.error('Database connection error:', error.message);
        pool = null;
        console.log('Falling back to JSON file storage');
    }
}

initDatabase();

// Discord Bot Client for tickets
let discordBot;
const TICKET_CATEGORY_ID = process.env.DISCORD_TICKET_CATEGORY_ID;
const TICKET_CHANNEL_ID = process.env.DISCORD_TICKET_CHANNEL_ID;

async function initDiscordBot() {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
        console.log('Discord bot token not configured - tickets disabled');
        return;
    }
    
    discordBot = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent
        ]
    });
    
    discordBot.once('ready', () => {
        console.log('Discord bot logged in as ' + discordBot.user.tag);
    });
    
    discordBot.on('messageCreate', async (message) => {
        // Handle messages in ticket threads
        if (message.channel.isThread() && message.author.bot === false) {
            const thread = message.channel;
            if (thread.name.startsWith('zamowienie-')) {
                // Log the message to console
                console.log(`Ticket message from ${message.author.username}: ${message.content}`);
            }
        }
    });
    
    discordBot.login(botToken).catch(err => {
        console.log('Discord bot login failed:', err.message);
    });
}

initDiscordBot();

// Create Discord ticket for order
async function createOrderTicket(order) {
    if (!discordBot || !TICKET_CHANNEL_ID) {
        console.log('Discord bot not configured - no ticket created');
        return null;
    }
    
    try {
        const guild = discordBot.guilds.cache.first();
        if (!guild) {
            console.log('Discord guild not found');
            return null;
        }
        
        const ticketChannel = await discordBot.channels.fetch(TICKET_CHANNEL_ID);
        if (!ticketChannel) {
            console.log('Ticket channel not found');
            return null;
        }
        
        const products = order.products ? order.products.map(p => p.name || p).join(', ') : 'Brak';
        const threadName = `zamowienie-${order.order_id}`;
        
        // Create a thread in the ticket channel
        const thread = await ticketChannel.threads.create({
            name: threadName,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            type: ChannelType.PrivateThread,
            reason: `New order: ${order.order_id}`
        });
        
        // Send order information to the thread
        await thread.send({
            content: `� **NOWE ZAMÓWIENIE** #${order.order_id}\n\n` +
                     `👤 **Klient:** ${order.customerName}\n` +
                     `📱 **Numer IC:** ${order.customerNumber}\n` +
                     `💬 **Discord:** ${order.discord}\n` +
                     `📦 **Produkty:** ${products}\n` +
                     `💰 **Cena:** ${(order.total || 0).toLocaleString()} $\n` +
                     `${order.discountCode ? `🏷️ **Rabat:** ${order.discountCode} (${order.discount}%)` : ''}\n\n` +
                     `Wątek do komunikacji z klientem.`
        });
        
        console.log(`Created ticket thread: ${threadName}`);
        return thread.id;
    } catch (error) {
        console.log('Error creating ticket:', error.message);
        return null;
    }
}

// Security: Backend Product Prices
const PRODUCT_PRICES = {
    vest35: { id: 'vest35', name: 'Kamizelka 35%', price: 10000, type: 'vest' },
    vest50: { id: 'vest50', name: 'Kamizelka 50%', price: 20000, type: 'vest' },
    vest75: { id: 'vest75', name: 'Kamizelka 75%', price: 35000, type: 'vest' },
    latarka: { id: 'latarka', name: 'Latarka do broni', price: 25000, type: 'accessory' },
    latarka_reczna: { id: 'latarka_reczna', name: 'Latarka reczna', price: 50000, type: 'accessory' },
    kabura: { id: 'kabura', name: 'Kabura', price: 250000, type: 'accessory' },
    magazynek: { id: 'magazynek', name: 'Magazynek', price: 60000, type: 'accessory' },
    zlote_malowanie: { id: 'zlote_malowanie', name: 'Złote malowanie', price: 500000, type: 'special' },
    powder: { id: 'powder', name: 'Farba w proszku', price: 15000, type: 'accessory' }
};

// Discount codes (server-side only)
const DISCOUNT_CODES = {
    // 50% discount codes
    'ARMOR-J8H3TEE': 50,
    'ARMOR-X4P9QWE': 50,
    'ARMOR-M7K2LZA': 50,
    'ARMOR-T9R5VBN': 50,
    'ARMOR-Y2U8HJK': 50,
    'ARMOR-P6D1FGA': 50,
    'ARMOR-N4C7XZM': 50,
    'ARMOR-B3L9QRT': 50,
    'ARMOR-H5W2EPU': 50,
    'ARMOR-K8M4ZXC': 50,
    'ARMOR-R1T7YUI': 50,
    'ARMOR-V6B2NMP': 50,
    'ARMOR-Q9A5SDF': 50,
    'ARMOR-L3K8JHG': 50,
    'ARMOR-E7R2TYU': 50,
    'ARMOR-U4I9OPA': 50,
    'ARMOR-Z6X1CVB': 50,
    'ARMOR-G8H3JKL': 50,
    'ARMOR-S5D2FGH': 50,
    'ARMOR-W7E4RTY': 50,
    // 30% discount codes
    'ARMOR-C3V8BNM': 30,
    'ARMOR-A9S4DFG': 30,
    'ARMOR-F2G7HJK': 30,
    'ARMOR-I5O1PAS': 30,
    'ARMOR-J6K3LZX': 30,
    'ARMOR-M8N4QWE': 30,
    'ARMOR-P2R9TYU': 30,
    'ARMOR-T5Y1UIO': 30,
    'ARMOR-V7B3NML': 30,
    'ARMOR-X8C4VBN': 30,
    'ARMOR-Z1A6SDF': 30,
    'ARMOR-H9J5KLP': 30,
    'ARMOR-L2Q7WER': 30,
    'ARMOR-D4F8GHJ': 30,
    'ARMOR-O3P9ASD': 30,
    'ARMOR-R6T1YUI': 30,
    'ARMOR-U8I4OPA': 30,
    'ARMOR-B5N2MZX': 30,
    'ARMOR-E7W3QAZ': 30,
    'ARMOR-K1L6XCV': 30,
    // 20% discount codes
    'ARMOR-PL8M2QA': 20,
    'ARMOR-WS4X7ED': 20,
    'ARMOR-RF9V1TG': 20,
    'ARMOR-YH3N8UJ': 20,
    'ARMOR-IK5M2OL': 20,
    'ARMOR-PA7Q4SZ': 20,
    'ARMOR-DF1W6XC': 20,
    'ARMOR-GH8E3VB': 20,
    'ARMOR-JK2R9NM': 20,
    'ARMOR-LZ4T7QA': 20,
    'ARMOR-XC6Y1WS': 20,
    'ARMOR-VB3U8ED': 20,
    'ARMOR-NM5I2RF': 20,
    'ARMOR-QA9O4TG': 20,
    'ARMOR-SZ7P1YH': 20,
    'ARMOR-WX2A6UJ': 20,
    'ARMOR-ED8S3IK': 20,
    'ARMOR-RF4D9OL': 20,
    'ARMOR-YH6G2LK': 20
};

// Production resources (server-side)
const PRODUCTION_RESOURCES = {
    'włókno techniczne': 50,
    'kevlar surowy': 30,
    'stal surowa': 25,
    'polimer': 20,
    'aluminium surowe': 15,
    'szkło techniczne': 10,
    'ogniwo zasilające': 10,
    'skóra techniczna': 8,
    'chemikalia przemysłowe': 5,
    'pigment premium': 5
};

// Production workstations
const WORKSTATIONS = {
    'material': { name: 'Warsztat Materiałowy', icon: 'fa-boxes', desc: 'Surowce' },
    'metal': { name: 'Warsztat Metalowy', icon: 'fa-industry', desc: 'Obróbka' },
    'polymer': { name: 'Warsztat Polimerowy', icon: 'fa-vial', desc: 'Polimery' },
    'assembly': { name: 'Stół Montażowy', icon: 'fa-wrench', desc: 'Montaż' },
    'paint': { name: 'Lakiernia', icon: 'fa-spray-can', desc: 'Wykończenie' }
};

// Production categories
const PRODUCTION_CATEGORIES = [
    { id: 'vests', name: 'Kamizelki', icon: 'fa-shield-alt' },
    { id: 'magazines', name: 'Magazynki', icon: 'fa-box' },
    { id: 'lights', name: 'Oświetlenie', icon: 'fa-lightbulb' },
    { id: 'holsters', name: 'Kabury', icon: 'fa-gun' },
    { id: 'paint', name: 'Malowania', icon: 'fa-paint-brush' }
];

// Production data (full)
const PRODUCTION_DATA = {
    'vest35': {
        id: 'vest35', name: 'Kamizelka 35%', desc: 'Podstawowa ochrona',
        image: '../images/Kamizelka35.png', price: 10000, difficulty: 'Łatwy',
        category: 'vests',
        stages: [
            { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 15000,
              inputs: { 'włókno techniczne': 4, 'kevlar surowy': 2, 'stal surowa': 1 },
              outputs: { 'pakiet surowców lekkich': 1 } },
            { id: 2, name: 'PRZERÓBKA', icon: 'fa-cogs', workstation: 'polymer', duration: 18000,
              inputs: { 'pakiet surowców lekkich': 1 },
              outputs: { 'tkanina balistyczna': 2, 'arkusz kevlaru': 1, 'płyta ochronna lekka': 1 } },
            { id: 3, name: 'CZĘŚCI', icon: 'fa-tools', workstation: 'metal', duration: 16000,
              inputs: { 'tkanina balistyczna': 2, 'arkusz kevlaru': 1 },
              outputs: { 'panel przedni lekki': 1, 'panel tylny lekki': 1, 'pas mocujący': 2 } },
            { id: 4, name: 'MONTAŻ', icon: 'fa-hammer', workstation: 'assembly', duration: 20000,
              inputs: { 'panel przedni lekki': 1, 'panel tylny lekki': 1, 'pas mocujący': 2 },
              outputs: { 'szkielet kamizelki lekkiej': 1 } },
            { id: 5, name: 'FINALIZACJA', icon: 'fa-check-circle', workstation: 'paint', duration: 10000,
              inputs: { 'szkielet kamizelki lekkiej': 1, 'płyta ochronna lekka': 1 },
              outputs: { 'Kamizelka 35%': 1 } }
        ]
    },
    'vest50': {
        id: 'vest50', name: 'Kamizelka 50%', desc: 'Średnia ochrona',
        image: '../images/Kamizelka50.png', price: 20000, difficulty: 'Średni',
        category: 'vests',
        stages: [
            { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 20000,
              inputs: { 'włókno techniczne': 5, 'kevlar surowy': 4, 'stal surowa': 2, 'polimer': 2 },
              outputs: { 'pakiet surowców standard': 1 } },
            { id: 2, name: 'PRZERÓBKA', icon: 'fa-cogs', workstation: 'polymer', duration: 25000,
              inputs: { 'pakiet surowców standard': 1 },
              outputs: { 'tkanina balistyczna': 2, 'arkusz kevlaru': 2, 'płyta balistyczna standard': 2, 'klamry montażowe': 2 } },
            { id: 3, name: 'CZĘŚCI', icon: 'fa-tools', workstation: 'metal', duration: 22000,
              inputs: { 'tkanina balistyczna': 2, 'arkusz kevlaru': 2, 'klamry montażowe': 2 },
              outputs: { 'panel przedni standard': 1, 'panel tylny standard': 1, 'pasy boczne': 2, 'uchwyty taktyczne': 2 } },
            { id: 4, name: 'MONTAŻ', icon: 'fa-hammer', workstation: 'assembly', duration: 28000,
              inputs: { 'panel przedni standard': 1, 'panel tylny standard': 1, 'pasy boczne': 2, 'uchwyty taktyczne': 2 },
              outputs: { 'korpus kamizelki standard': 1 } },
            { id: 5, name: 'FINALIZACJA', icon: 'fa-check-circle', workstation: 'paint', duration: 15000,
              inputs: { 'korpus kamizelki standard': 1, 'płyta balistyczna standard': 2 },
              outputs: { 'Kamizelka 50%': 1 } }
        ]
    },
    'vest75': {
        id: 'vest75', name: 'Kamizelka 75%', desc: 'Wysoka ochrona',
        image: '../images/Kamizelka75.png', price: 35000, difficulty: 'Trudny',
        category: 'vests',
        stages: [
            { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 25000,
              inputs: { 'włókno techniczne': 6, 'kevlar surowy': 6, 'stal surowa': 3, 'polimer': 3, 'aluminium surowe': 2 },
              outputs: { 'pakiet surowców ciężkich': 1 } },
            { id: 2, name: 'PRZERÓBKA', icon: 'fa-cogs', workstation: 'polymer', duration: 30000,
              inputs: { 'pakiet surowców ciężkich': 1 },
              outputs: { 'tkanina balistyczna premium': 2, 'arkusz kevlaru premium': 3, 'płyta balistyczna ciężka': 3, 'szyny MOLLE': 2 } },
            { id: 3, name: 'CZĘŚCI', icon: 'fa-tools', workstation: 'metal', duration: 28000,
              inputs: { 'tkanina balistyczna premium': 2, 'arkusz kevlaru premium': 3, 'szyny MOLLE': 2 },
              outputs: { 'panel przedni ciężki': 1, 'panel tylny ciężki': 1, 'system boczny': 2, 'moduł taktyczny MOLLE': 1 } },
            { id: 4, name: 'MONTAŻ', icon: 'fa-hammer', workstation: 'assembly', duration: 35000,
              inputs: { 'panel przedni ciężki': 1, 'panel tylny ciężki': 1, 'system boczny': 2 },
              outputs: { 'korpus kamizelki ciężkiej': 1, 'wkład ochronny ciężki': 1 } },
            { id: 5, name: 'FINALIZACJA', icon: 'fa-check-circle', workstation: 'paint', duration: 18000,
              inputs: { 'korpus kamizelki ciężkiej': 1, 'wkład ochronny ciężki': 1, 'moduł taktyczny MOLLE': 1 },
              outputs: { 'Kamizelka 75%': 1 } }
        ]
    },
    'kabura': {
        id: 'kabura', name: 'Kabura', desc: 'Kabura na broń',
        image: '../images/Kabura.png', price: 250000, difficulty: 'Elite',
        category: 'holsters',
        stages: [
            { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 25000,
              inputs: { 'skóra techniczna': 4, 'polimer': 2, 'aluminium surowe': 1 },
              outputs: { 'pakiet kabury': 1 } },
            { id: 2, name: 'PRZERÓBKA', icon: 'fa-cogs', workstation: 'polymer', duration: 30000,
              inputs: { 'pakiet kabury': 1 },
              outputs: { 'formowana skóra': 2, 'korpus polimerowy': 1, 'klips montażowy': 1 } },
            { id: 3, name: 'CZĘŚCI', icon: 'fa-tools', workstation: 'metal', duration: 28000,
              inputs: { 'formowana skóra': 2, 'korpus polimerowy': 1 },
              outputs: { 'osłona kabury': 1, 'mocowanie pasa': 1, 'blokada kabury': 1 } },
            { id: 4, name: 'MONTAŻ', icon: 'fa-hammer', workstation: 'assembly', duration: 35000,
              inputs: { 'osłona kabury': 1, 'mocowanie pasa': 1, 'blokada kabury': 1 },
              outputs: { 'korpus kabury': 1 } },
            { id: 5, name: 'FINALIZACJA', icon: 'fa-check-circle', workstation: 'paint', duration: 18000,
              inputs: { 'korpus kabury': 1, 'klips montażowy': 1 },
              outputs: { 'Kabura': 1 } }
        ]
    },
    'latarka': {
        id: 'latarka', name: 'Latarka do broni', desc: 'Latarka taktyczna',
        image: '../images/latarka_broń.png', price: 25000, difficulty: 'Średni',
        category: 'lights',
        stages: [
            { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 20000,
              inputs: { 'aluminium surowe': 2, 'szkło techniczne': 1, 'ogniwo zasilające': 2, 'polimer': 1 },
              outputs: { 'pakiet oświetlenia taktycznego': 1 } },
            { id: 2, name: 'PRZERÓBKA', icon: 'fa-cogs', workstation: 'metal', duration: 25000,
              inputs: { 'pakiet oświetlenia taktycznego': 1 },
              outputs: { 'obudowa latarki': 1, 'soczewka': 1, 'bateria robocza': 1, 'uchwyt montażowy': 1 } },
            { id: 3, name: 'CZĘŚCI', icon: 'fa-tools', workstation: 'polymer', duration: 22000,
              inputs: { 'obudowa latarki': 1, 'soczewka': 1, 'bateria robocza': 1 },
              outputs: { 'głowica światła': 1, 'moduł zasilania': 1, 'mocowanie do szyny': 1 } },
            { id: 4, name: 'MONTAŻ', icon: 'fa-hammer', workstation: 'assembly', duration: 28000,
              inputs: { 'głowica światła': 1, 'moduł zasilania': 1, 'mocowanie do szyny': 1 },
              outputs: { 'moduł latarki broniowej': 1 } },
            { id: 5, name: 'FINALIZACJA', icon: 'fa-check-circle', workstation: 'paint', duration: 15000,
              inputs: { 'moduł latarki broniowej': 1, 'uchwyt montażowy': 1 },
              outputs: { 'Latarka do broni': 1 } }
        ]
    },
    'latarka_reczna': {
        id: 'latarka_reczna', name: 'Latarka ręczna', desc: 'Latarka LED',
        image: '../images/Latarka.png', price: 50000, difficulty: 'Łatwy',
        category: 'lights',
        stages: [
            { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 15000,
              inputs: { 'aluminium surowe': 2, 'szkło techniczne': 1, 'ogniwo zasilające': 2, 'polimer': 1 },
              outputs: { 'pakiet oświetlenia ręcznego': 1 } },
            { id: 2, name: 'PRZERÓBKA', icon: 'fa-cogs', workstation: 'metal', duration: 18000,
              inputs: { 'pakiet oświetlenia ręcznego': 1 },
              outputs: { 'obudowa ręczna': 1, 'soczewka': 1, 'bateria robocza': 1, 'przycisk zasilania': 1 } },
            { id: 3, name: 'CZĘŚCI', icon: 'fa-tools', workstation: 'polymer', duration: 16000,
              inputs: { 'obudowa ręczna': 1, 'soczewka': 1, 'bateria robocza': 1 },
              outputs: { 'głowica latarki': 1, 'moduł zasilania': 1, 'rękojeść': 1 } },
            { id: 4, name: 'MONTAŻ', icon: 'fa-hammer', workstation: 'assembly', duration: 20000,
              inputs: { 'głowica latarki': 1, 'moduł zasilania': 1, 'rękojeść': 1 },
              outputs: { 'korpus latarki': 1 } },
            { id: 5, name: 'FINALIZACJA', icon: 'fa-check-circle', workstation: 'paint', duration: 10000,
              inputs: { 'korpus latarki': 1 },
              outputs: { 'Latarka ręczna': 1 } }
        ]
    },
    'magazynek': {
        id: 'magazynek', name: 'Powiększony magazynek', desc: 'Większa pojemność',
        image: '../images/Pow_magazynek.png', price: 60000, difficulty: 'Średni',
        category: 'magazines',
        stages: [
            { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 20000,
              inputs: { 'stal surowa': 3, 'polimer': 2, 'aluminium surowe': 1 },
              outputs: { 'pakiet magazynka rozszerzonego': 1 } },
            { id: 2, name: 'PRZERÓBKA', icon: 'fa-cogs', workstation: 'metal', duration: 25000,
              inputs: { 'pakiet magazynka rozszerzonego': 1 },
              outputs: { 'wydłużony korpus magazynka': 1, 'sprężyna wzmocniona': 1, 'rozszerzona stopka': 1, 'adapter montażowy': 1 } },
            { id: 3, name: 'CZĘŚCI', icon: 'fa-tools', workstation: 'polymer', duration: 22000,
              inputs: { 'wydłużony korpus magazynka': 1, 'sprężyna wzmocniona': 1, 'adapter montażowy': 1 },
              outputs: { 'moduł dużej pojemności': 1 } },
            { id: 4, name: 'MONTAŻ', icon: 'fa-hammer', workstation: 'assembly', duration: 28000,
              inputs: { 'moduł dużej pojemności': 1, 'rozszerzona stopka': 1 },
              outputs: { 'mechanizm magazynka premium': 1 } },
            { id: 5, name: 'FINALIZACJA', icon: 'fa-check-circle', workstation: 'paint', duration: 15000,
              inputs: { 'mechanizm magazynka premium': 1 },
              outputs: { 'Powiększony magazynek': 1 } }
        ]
    },
    'zlote': {
        id: 'zlote', name: 'Złote malowanie', desc: 'Złoty wygląd broni',
        image: '../images/Złote_malowanie.png', price: 280000, difficulty: 'Elite',
        category: 'paint',
        stages: [
            { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 25000,
              inputs: { 'chemikalia przemysłowe': 2, 'pigment premium': 2, 'aluminium surowe': 1, 'szkło techniczne': 1 },
              outputs: { 'pakiet lakierniczy premium': 1 } },
            { id: 2, name: 'PRZERÓBKA', icon: 'fa-cogs', workstation: 'polymer', duration: 30000,
              inputs: { 'pakiet lakierniczy premium': 1 },
              outputs: { 'baza lakiernicza': 1, 'mieszanka pigmentu': 1, 'utwardzacz': 1, 'aplikator natryskowy': 1 } },
            { id: 3, name: 'CZĘŚCI', icon: 'fa-tools', workstation: 'metal', duration: 28000,
              inputs: { 'baza lakiernicza': 1, 'mieszanka pigmentu': 1, 'utwardzacz': 1 },
              outputs: { 'zestaw lakierniczy premium': 1, 'warstwa podkładowa': 1 } },
            { id: 4, name: 'MONTAŻ', icon: 'fa-hammer', workstation: 'assembly', duration: 35000,
              inputs: { 'zestaw lakierniczy premium': 1, 'warstwa podkładowa': 1, 'aplikator natryskowy': 1 },
              outputs: { 'pakiet malowania dekoracyjnego': 1 } },
            { id: 5, name: 'FINALIZACJA', icon: 'fa-check-circle', workstation: 'paint', duration: 18000,
              inputs: { 'pakiet malowania dekoracyjnego': 1 },
              outputs: { 'Złote malowanie': 1 } }
        ]
    }
};

// Discord configuration
const discordScopes = ['identify', 'guilds'];
const discordPermissions = '0';

const ADMIN_ROLES = (process.env.DISCORD_ADMIN_ROLES || '').split(',').filter(r => r);

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRES_IN = '7d';

function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            discriminator: user.discriminator,
            avatar: user.avatar
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (e) {
        return null;
    }
}

// JWT middleware
function requireJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Brak tokena JWT' });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
        return res.status(401).json({ error: 'Niepoprawny lub wygasły token' });
    }
    
    req.jwtUser = decoded;
    next();
}

// Passport Discord setup
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL || '/auth/discord/callback'
}, (accessToken, refreshToken, profile, done) => {
    process.nextTick(() => done(null, profile));
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Auth middleware
function requireAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: 'Unauthorized' });
}

function requireAdmin(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userRoles = req.user.roles || [];
    const hasAdminRole = ADMIN_ROLES.some(roleId => userRoles.includes(roleId));
    
    if (hasAdminRole || ADMIN_ROLES.length === 0) {
        return next();
    }
    
    res.status(403).json({ error: 'Forbidden - Admin access required' });
}

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
    message: 'Zbyt wiele zapytań. Spróbuj później.'
});

const ordersRateLimit = rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 5,
    message: 'Zbyt wiele zamówień. Odczekaj chwilę.'
});

// Load JSON files
function loadJSON(file) {
    try {
        if (fs.existsSync(file)) {
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        }
    } catch (e) { console.log('Error loading JSON:', e.message); }
    return [];
}

function saveJSON(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } catch (e) { console.log('Error saving JSON:', e.message); }
}

let orders = loadJSON('orders.json');
let gallery = loadJSON('gallery.json');
let bans = loadJSON('bans.json');

// Send order notification
async function sendOrderWebhook(order) {
    const webhookUrl = process.env.ORDER_WEBHOOK_URL;
    if (!webhookUrl) return;
    
    const products = order.products ? order.products.map(p => p.name || p).join(', ') : 'Brak';
    const orderNumber = order.order_id || order.id || 'N/A';
    
    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: 'NOWE ZAMOWIENIE #' + orderNumber,
                    color: 0x00d4ff,
                    fields: [
                        { name: 'Numer zamowienia', value: orderNumber, inline: true },
                        { name: 'Klient', value: order.customerName || 'Nieznany', inline: true },
                        { name: 'Numer IC', value: order.customerNumber || 'Brak', inline: true },
                        { name: 'Discord', value: order.discord || 'Brak', inline: true },
                        { name: 'Produkty', value: products, inline: false },
                        { name: 'Cena', value: (order.total || 0).toLocaleString() + ' $', inline: true },
                        { name: 'Rabat', value: order.discountCode ? order.discountCode + ' (' + (order.discount || 0) + '%)' : 'Brak', inline: true }
                    ],
                    footer: { text: 'ARMOR Shop' },
                    timestamp: new Date().toISOString()
                }]
            })
        });
    } catch (e) { console.log('Order webhook error:', e.message); }
    
    console.log('Nowe zamowienie #' + orderNumber + ' - ' + (order.customerName || 'Nieznany') + ' - ' + products);
}

app.use(express.static(path.join(__dirname, 'pages')));
app.use(express.static(__dirname));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/sound', express.static(path.join(__dirname, 'sound')));

// Chat AI endpoint
const chatRateLimit = rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: 'Zbyt wiele wiadomości. Odczekaj chwilę.',
    keyGenerator: (req) => req.ip + '_chat'
});

app.post('/api/chat', chatRateLimit, async (req, res) => {
    const message = req.body.message;
    if (!message) return res.status(400).json({ error: 'Brak wiadomosci' });
    
    var lowerMsg = message.toLowerCase();
    
    // Quick responses
    if (lowerMsg.includes('cena') || lowerMsg.includes('koszt') || lowerMsg.includes('ile')) {
        return res.json({ reply: 'Ceny kamizelek: Kamizelka 35% - 10.000 $, Kamizelka 50% - 20.000 $, Kamizelka 75% - 35.000 $. Ceny akcesoria: Latarka - 25.000 $, Kabura - 250.000 $, Magazynek - 60.000 $' });
    }
    
    if (lowerMsg.includes('kamizel') || lowerMsg.includes('vest')) {
        return res.json({ reply: 'Dostepne kamizelki: 35% - 10.000 $, 50% - 20.000 $, 75% - 35.000 $. Rabat dla sluzb do 40%!' });
    }
    
    if (lowerMsg.includes('bron') || lowerMsg.includes('gun') || lowerMsg.includes('latarka') || lowerMsg.includes('kabura')) {
        return res.json({ reply: 'Dostepne wyposazenie: Latarka do broni - 25.000 $, Latarka reczna - 50.000 $, Kabura - 250.000 $, Magazynek - 60.000 $' });
    }
    
    if (lowerMsg.includes('kup') || lowerMsg.includes('zamow') || lowerMsg.includes('kupic')) {
        return res.json({ reply: 'Aby zakupic, wejdz w zakladke SKLEP na stronie glownej!' });
    }
    
    // Try AI
    var AI_GATEWAY_KEY = process.env.AI_GATEWAY_KEY;
    if (AI_GATEWAY_KEY) {
        try {
            var response = await fetch('https://gateway.aihub.cn/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + AI_GATEWAY_KEY
                },
                body: JSON.stringify({
                    model: 'openai/gpt-4o',
                    messages: [
                        { role: 'system', content: 'Jestes asystentem sklepu Armor dla FiveM. Badz pomocny i krotki.' },
                        { role: 'user', content: message }
                    ],
                    max_tokens: 500
                })
            });
            
            if (response.ok) {
                var data = await response.json();
                var reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
                if (reply) return res.json({ reply: reply });
            }
        } catch (e) {
            console.log('AI Gateway failed');
        }
    }
    
    // Default responses
    var responses = [
        'Dziekuje za wiadomosc! Wejdz w SKLEP aby zobaczyc produkty.',
        'Sprawdz ceny w zakladce SKLEP. Oferujemy kamizelki i akcesoria.',
        'Potrzebujesz pomocy? Wejdz na SKLEP!',
        'Jestem asystentem Armor. Zapraszamy do zakupow!'
    ];
    var randomResponse = responses[Math.floor(Math.random() * responses.length)];
    res.json({ reply: randomResponse });
});

// Discord OAuth
app.get('/auth/discord', passport.authenticate('discord', { scope: discordScopes }));

app.get('/auth/discord/callback', passport.authenticate('discord', { failureRedirect: '/login' }), async function(req, res) {
    // Check if user has required role for production
    if (req.user.roles) {
        req.session.userRoles = req.user.roles;
    }
    res.redirect('/');
});

app.get('/logout', function(req, res) {
    req.logout(function() { res.redirect('/'); });
});

// User info endpoint
app.get('/api/user', function(req, res) {
    if (!req.isAuthenticated()) {
        return res.json({ loggedIn: false });
    }
    
    const userRoles = req.session.userRoles || req.user.roles || [];
    const isAdmin = ADMIN_ROLES.length === 0 || ADMIN_ROLES.some(roleId => userRoles.includes(roleId));
    
    res.json({
        loggedIn: true,
        username: req.user.username,
        discriminator: req.user.discriminator,
        avatar: req.user.avatar,
        id: req.user.id,
        isAdmin: isAdmin,
        roles: userRoles
    });
});

// Generate JWT token (for API clients)
app.get('/api/token', function(req, res) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Zaloguj się przez Discord' });
    }
    
    const token = generateToken(req.user);
    res.json({ token: token });
});

// Products endpoint (public - prices hidden)
app.get('/api/products', function(req, res) {
    const productsList = Object.values(PRODUCT_PRICES).map(p => ({
        id: p.id,
        name: p.name,
        type: p.type
    }));
    res.json(productsList);
});

// Production data endpoints
app.get('/api/production', function(req, res) {
    res.json({
        resources: PRODUCTION_RESOURCES,
        workstations: WORKSTATIONS,
        categories: PRODUCTION_CATEGORIES,
        products: Object.values(PRODUCTION_DATA)
    });
});

app.get('/api/production/products', function(req, res) {
    const { category } = req.query;
    let products = Object.values(PRODUCTION_DATA);
    
    if (category && category !== 'all') {
        products = products.filter(p => p.category === category);
    }
    
    res.json(products);
});

app.get('/api/production/resources', function(req, res) {
    res.json(PRODUCTION_RESOURCES);
});

app.get('/api/production/workstations', function(req, res) {
    res.json(WORKSTATIONS);
});

app.get('/api/production/categories', function(req, res) {
    res.json(PRODUCTION_CATEGORIES);
});

// User production data (authenticated)
app.get('/api/user/production', requireAuth, async function(req, res) {
    try {
        if (pool) {
            const [rows] = await pool.execute(
                'SELECT * FROM user_production WHERE discordId = ?',
                [req.user.id]
            );
            if (rows.length > 0) {
                return res.json({
                    resources: JSON.parse(rows[0].resources || '{}'),
                    equipment: JSON.parse(rows[0].equipment || '{}'),
                    inventory: JSON.parse(rows[0].inventory || '{}')
                });
            }
        }
        res.json({ resources: {}, equipment: {}, inventory: {} });
    } catch (e) {
        res.json({ resources: {}, equipment: {}, inventory: {} });
    }
});

app.post('/api/user/production', requireAuth, async function(req, res) {
    const { resources, equipment, inventory } = req.body;
    
    try {
        if (pool) {
            // Check if exists
            const [rows] = await pool.execute(
                'SELECT id FROM user_production WHERE discordId = ?',
                [req.user.id]
            );
            
            if (rows.length > 0) {
                await pool.execute(
                    'UPDATE user_production SET resources = ?, equipment = ?, inventory = ? WHERE discordId = ?',
                    [JSON.stringify(resources || {}), JSON.stringify(equipment || {}), JSON.stringify(inventory || {}), req.user.id]
                );
            } else {
                await pool.execute(
                    'INSERT INTO user_production (discordId, resources, equipment, inventory) VALUES (?, ?, ?, ?)',
                    [req.user.id, JSON.stringify(resources || {}), JSON.stringify(equipment || {}), JSON.stringify(inventory || {})]
                );
            }
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Validate discount code (server-side)
app.post('/api/validate-discount', function(req, res) {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Brak kodu' });
    
    const normalizedCode = code.toUpperCase();
    const discount = DISCOUNT_CODES[normalizedCode];
    if (discount) {
        res.json({ valid: true, discount: discount });
    } else {
        res.json({ valid: false, discount: 0 });
    }
});

// Calculate order price (server-side)
function calculateOrderTotal(products, discountCode) {
    let total = 0;
    for (const p of products) {
        const product = PRODUCT_PRICES[p.id];
        if (product) {
            total += product.price * (p.quantity || 1);
        }
    }
    
    // Apply discount
    if (discountCode) {
        const normalizedCode = discountCode.toUpperCase();
        const discount = DISCOUNT_CODES[normalizedCode];
        if (discount) {
            total = total * (1 - discount / 100);
        }
    }
    
    return Math.round(total);
}

// Create order
app.post('/api/orders', ordersRateLimit, async function(req, res) {
    const { products, customerName, customerNumber, discountCode, faction } = req.body;
    
    if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ error: 'Brak produktow' });
    }
    
    // Validate products and get prices
    const orderProducts = products.map(p => {
        const product = PRODUCT_PRICES[p.id];
        return {
            id: p.id,
            name: product ? product.name : p.id,
            quantity: p.quantity || 1,
            price: product ? product.price : 0
        };
    });
    
    // Calculate total server-side
    const total = calculateOrderTotal(orderProducts, discountCode);
    
    // Create order
    const order = {
        id: Date.now(),
        order_id: 'ORD-' + Date.now(),
        products: orderProducts,
        customerName,
        customerNumber,
        discountCode: discountCode || null,
        discount: discountCode ? (DISCOUNT_CODES[discountCode.toUpperCase()] || 0) : 0,
        total,
        faction: faction || 'Brak',
        discord: req.user ? req.user.username + '#' + req.user.discriminator : 'Niezalogowany',
        discordId: req.user ? req.user.id : null,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    // Save to database or JSON
    if (pool) {
        try {
            await pool.execute(
                'INSERT INTO orders (order_id, products, customerName, customerNumber, discountCode, discount, total, faction, discord, discordId, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [order.order_id, JSON.stringify(orderProducts), customerName, customerNumber, order.discountCode, order.discount, total, faction, order.discord, order.discordId, 'pending', order.createdAt]
            );
        } catch (e) {
            console.log('Database error:', e.message);
        }
    } else {
        orders.push(order);
        saveJSON('orders.json', orders);
    }
    
    // Send webhook notification
    await sendOrderWebhook(order);
    
    // Create Discord ticket
    const ticketId = await createOrderTicket(order);
    
    res.json({ success: true, orderId: order.order_id, total: total, ticketId: ticketId });
});

// Get orders (for logged in user or admin)
app.get('/api/orders', async function(req, res) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Zaloguj sie' });
    }
    
    const userRoles = req.session.userRoles || req.user.roles || [];
    const isAdmin = ADMIN_ROLES.length === 0 || ADMIN_ROLES.some(roleId => userRoles.includes(roleId));
    
    try {
        if (pool) {
            let query = 'SELECT * FROM orders';
            let params = [];
            
            if (!isAdmin) {
                query += ' WHERE discordId = ?';
                params.push(req.user.id);
            }
            
            query += ' ORDER BY createdAt DESC';
            
            const [rows] = await pool.execute(query, params);
            res.json(rows.map(r => ({
                ...r,
                products: JSON.parse(r.products || '[]')
            })));
        } else {
            let userOrders = orders;
            if (!isAdmin) {
                userOrders = orders.filter(o => o.discordId === req.user.id);
            }
            res.json(userOrders);
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Gallery endpoints
app.get('/api/gallery', async function(req, res) {
    try {
        if (pool) {
            const [rows] = await pool.execute('SELECT * FROM gallery ORDER BY createdAt DESC');
            res.json(rows);
        } else {
            res.json(gallery);
        }
    } catch (e) {
        res.json(gallery);
    }
});

app.post('/api/gallery', requireAuth, function(req, res) {
    const { imageUrl, description } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'Brak URL zdjecia' });
    
    const item = {
        id: Date.now(),
        imageUrl,
        description: description || '',
        createdAt: new Date().toISOString()
    };
    
    if (pool) {
        pool.execute('INSERT INTO gallery (imageUrl, description, createdAt) VALUES (?, ?, ?)', 
            [imageUrl, description || '', item.createdAt])
            .then(() => res.json(item))
            .catch(e => res.status(500).json({ error: e.message }));
    } else {
        gallery.push(item);
        saveJSON('gallery.json', gallery);
        res.json(item);
    }
});

app.delete('/api/gallery/:id', requireAuth, function(req, res) {
    const { id } = req.params;
    
    if (pool) {
        pool.execute('DELETE FROM gallery WHERE id = ?', [id])
            .then(() => res.json({ success: true }))
            .catch(e => res.status(500).json({ error: e.message }));
    } else {
        gallery = gallery.filter(g => g.id != id);
        saveJSON('gallery.json', gallery);
        res.json({ success: true });
    }
});

// Bans endpoints
app.get('/api/bans', requireAuth, async function(req, res) {
    try {
        if (pool) {
            const [rows] = await pool.execute('SELECT * FROM bans ORDER BY createdAt DESC');
            res.json(rows);
        } else {
            res.json(bans);
        }
    } catch (e) {
        res.json(bans);
    }
});

app.post('/api/bans/ip', requireAuth, function(req, res) {
    const { ip, reason } = req.body;
    if (!ip) return res.status(400).json({ error: 'Brak IP' });
    
    const ban = { ip, reason: reason || '', createdAt: new Date().toISOString() };
    
    if (pool) {
        pool.execute('INSERT INTO bans (ip, reason, createdAt) VALUES (?, ?, ?)', 
            [ip, reason || '', ban.createdAt])
            .then(() => res.json(ban))
            .catch(e => res.status(500).json({ error: e.message }));
    } else {
        bans.push(ban);
        saveJSON('bans.json', bans);
        res.json(ban);
    }
});

app.delete('/api/bans/ip', requireAuth, function(req, res) {
    const { ip } = req.body;
    
    if (pool) {
        pool.execute('DELETE FROM bans WHERE ip = ?', [ip])
            .then(() => res.json({ success: true }))
            .catch(e => res.status(500).json({ error: e.message }));
    } else {
        bans = bans.filter(b => b.ip !== ip);
        saveJSON('bans.json', bans);
        res.json({ success: true });
    }
});

app.post('/api/bans/discord', requireAuth, function(req, res) {
    const { discordId, reason } = req.body;
    if (!discordId) return res.status(400).json({ error: 'Brak Discord ID' });
    
    const ban = { discordId, reason: reason || '', createdAt: new Date().toISOString() };
    
    if (pool) {
        pool.execute('INSERT INTO bans (discordId, reason, createdAt) VALUES (?, ?, ?)', 
            [discordId, reason || '', ban.createdAt])
            .then(() => res.json(ban))
            .catch(e => res.status(500).json({ error: e.message }));
    } else {
        bans.push(ban);
        saveJSON('bans.json', bans);
        res.json(ban);
    }
});

app.delete('/api/bans/discord', requireAuth, function(req, res) {
    const { discordId } = req.body;
    
    if (pool) {
        pool.execute('DELETE FROM bans WHERE discordId = ?', [discordId])
            .then(() => res.json({ success: true }))
            .catch(e => res.status(500).json({ error: e.message }));
    } else {
        bans = bans.filter(b => b.discordId !== discordId);
        saveJSON('bans.json', bans);
        res.json({ success: true });
    }
});

// Logs endpoint
app.get('/api/logs', requireAuth, async function(req, res) {
    try {
        if (pool) {
            const [rows] = await pool.execute('SELECT * FROM logs ORDER BY createdAt DESC LIMIT 100');
            res.json(rows);
        } else {
            res.json([]);
        }
    } catch (e) {
        res.json([]);
    }
});

app.post('/api/logs', requireAuth, function(req, res) {
    const { action, details } = req.body;
    
    if (pool) {
        pool.execute('INSERT INTO logs (action, details, userId, createdAt) VALUES (?, ?, ?, ?)', 
            [action, details || '', req.user.id, new Date().toISOString()])
            .then(() => res.json({ success: true }))
            .catch(e => res.status(500).json({ error: e.message }));
    } else {
        res.json({ success: true });
    }
});

// Break mode
let breakMode = { active: false, message: '' };

function getBreakSettings() {
    return breakMode;
}

app.get('/api/break-status', function(req, res) {
    res.json(getBreakSettings());
});

app.post('/api/break-mode', requireAuth, function(req, res) {
    const { active, message } = req.body;
    breakMode = { active: active || false, message: message || '' };
    res.json({ success: true, ...breakMode });
});

// Admin page
app.get('/admin', function(req, res) {
    res.sendFile(path.join(__dirname, 'pages', 'admin.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
    console.log('Server running on port ' + PORT);
});

module.exports = app;
