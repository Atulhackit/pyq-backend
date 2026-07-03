import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pool from './config/db'

dotenv.config()

const app= express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// health check route
app.get('/health',async (req, res) =>{
    try{
        await pool.query('SELECT 1')
        res.json({
            status : 'ok',
            database : 'connencted'
        })
    } catch (error) {
        res.status(500).json({
            status : 'error',
            database : 'disconnected'
        })
    }
})

// start server
app.listen(PORT, () => {
    console.log( ` Server running on port ${PORT}`)
})