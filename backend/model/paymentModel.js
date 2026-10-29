const { model, Schema } = require('mongoose')

const paymentSchema = new Schema({
    userId: {
        type: Schema.Types.Mixed,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: 'BDT',
    },
    trxID: {
        type: String,
        sparse: true,
    },
    paymentID: {
        type: String,
    },
    date: {
        type: String,
    },
    val_id: {
        type: String,
    },
    gateway: {
        type: String,
        enum: ['bkash', 'sslcommerz', 'stripe'],
        default: 'bkash',
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed', 'Cancelled'],
        default: 'Completed',
    },
    orderId: {
        type: String,
    },
    customerEmail: {
        type: String,
    },
    customerPhone: {
        type: String,
    },
    firstname: {
        type: String,
    },
    lastname: {
        type: String,
    },
    department: {
        type: String,
    },
    university: {
        type: String,
    },
    pendingPassword: {
        type: String,
    },
    accountCreated: {
        type: Boolean,
        default: false,
    },
    accountExistedBefore: {
        type: Boolean,
        default: false,
    },
    tempCredential: {
        email: String,
        password: String,
        claimed: {
            type: Boolean,
            default: false,
        },
    },
    rawResponse: {
        type: Schema.Types.Mixed,
    }
}, { timestamps: true })

module.exports = model('payments', paymentSchema)