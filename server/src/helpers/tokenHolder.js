'use strict'

const utils = require('./utils')
const BigNumber = require('bignumber.js')
const db = require('../models')

let TokenHolderHelper = {
    formatHolder: async (tokenHolder, totalSupply, decimals) => {
        if (totalSupply) {
            totalSupply = new BigNumber(totalSupply)
            let quantity = new BigNumber(await utils.convertHexToFloat(tokenHolder.quantity, 16))
            tokenHolder.balance = tokenHolder.balance || quantity.toString(10)

            let percentage = await quantity.div(totalSupply) * 100
            percentage = percentage.toFixed(4)
            percentage = (percentage.toString() === '0.0000') ? '0.0001' : percentage
            tokenHolder.percentage = percentage
        }

        return tokenHolder
    },

    updateQuality: async (hash, token, quantity) => {
        let holder = await db.TokenHolder.findOne({ hash: hash, token: token })
        if (!holder) {
            // Create new.
            holder = await db.TokenHolder.create({
                hash: hash,
                token: token,
                quantity: 0
            })
        }

        holder.balance = new BigNumber(quantity).toString(10)
        // Convert number to hex.
        quantity = parseFloat(quantity).toString(16)
        let quantityCalc = await utils.convertHexToFloat(holder.quantity, 16) +
            await utils.convertHexToFloat(quantity, 16)
        let newQuantity = quantityCalc.toString(16)
        if (newQuantity.indexOf('-') >= 0) {
            newQuantity = newQuantity.replace('-', '')
            newQuantity = newQuantity.padStart(64, '0')
            newQuantity = '-' + newQuantity
        } else {
            newQuantity = newQuantity.padStart(64, '0')
        }
        holder.quantity = newQuantity
        holder.quantityNumber = quantityCalc
        holder.save()
    }
}

module.exports = TokenHolderHelper
