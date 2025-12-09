// File: api/submit-order.js

// 1. นำเข้า Package สำหรับเชื่อมต่อ MongoDB
import { MongoClient } from 'mongodb';

// 2. ดึงค่า Connection String (Key) จาก Vercel Environment Variables
const uri = process.env.MONGODB_URI;
let client;

// ฟังก์ชันสำหรับเชื่อมต่อฐานข้อมูล (ใช้ครั้งเดียวและเก็บ Client ไว้)
async function connectToDatabase() {
    if (!uri) {
        throw new Error("MONGODB_URI is not set in environment variables.");
    }
    // สร้าง client ใหม่ถ้ายังไม่มีหรือถูกปิดไปแล้ว
    if (!client || !client.topology || !client.topology.isConnected()) {
        client = new MongoClient(uri);
        await client.connect();
    }
    // ส่งค่า client กลับไป
    return client;
}


// 3. ฟังก์ชันหลักที่ Vercel จะเรียกใช้เมื่อมี request เข้ามา
export default async function handler(request, response) {
    // ตรวจสอบ Method: ต้องเป็น POST
    if (request.method !== 'POST') {
        return response.status(405).send('Method Not Allowed');
    }

    try {
        // ดึงข้อมูลออเดอร์ที่ถูกส่งมาจาก Frontend
        const orderData = request.body;
        
        if (!orderData || orderData.items.length === 0) {
            return response.status(400).json({ error: 'Order data is missing or empty.' });
        }

        // --- 4. การเชื่อมต่อและบันทึกข้อมูลลง MongoDB Atlas ---
        
        const dbClient = await connectToDatabase();
        // ตั้งชื่อ Database ที่คุณต้องการใช้ (เช่น 'BANGFOOD_DB' หรือตามชื่อที่คุณต้องการ)
        const database = dbClient.db('BangfoodDB'); 
        const ordersCollection = database.collection('orders'); // ชื่อ Collection/ตารางสำหรับเก็บออเดอร์

        // เตรียมข้อมูลออเดอร์ที่สมบูรณ์
        const fullOrder = {
            table: orderData.table || 'Unknown', // เพิ่มรหัสโต๊ะ (ถ้ามี)
            items: orderData.items,
            totalPrice: orderData.totalPrice,
            status: 'NEW', // สถานะเริ่มต้นของออเดอร์
            createdAt: new Date(),
        };

        // บันทึกออเดอร์ลงใน Collection
        const result = await ordersCollection.insertOne(fullOrder);

        // 5. ส่งคำตอบกลับไปที่ Frontend
        return response.status(200).json({ 
            success: true, 
            message: 'Order submitted successfully!',
            orderId: result.insertedId 
        });

    } catch (error) {
        console.error('Error processing order or connecting to DB:', error);
        return response.status(500).json({ 
            success: false, 
            message: 'Internal Server Error. Check Vercel logs.',
            detail: error.message
        });
    }
    // หมายเหตุ: ไม่ต้องใส่ client.close() ที่นี่ เพราะ Vercel Serverless Function ควรเชื่อมต่อแบบ Keep-alive 
}