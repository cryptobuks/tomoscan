import { Router } from 'express'
import { paginate } from '../helpers/utils'
import db from '../models'
import TokenHolderHelper from '../helpers/tokenHolder'
const logger = require('../helpers/logger')

const TokenHolderController = Router()

TokenHolderController.get('/token-holders', async (req, res) => {
    try {
        let address = (req.query.address || '').toLowerCase()
        let params = {}
        if (address) {
            params.query = { token: address }
        }
        let hash = (req.query.hash || '').toLowerCase()
        if (hash) {
            params.query = { hash: hash }
        }
        params.sort = { quantity: -1 }
        params.query = Object.assign(params.query, { quantityNumber: { $gte: 0 } })
        let data = await paginate(req, 'TokenHolder', params)

        let items = data.items
        if (items.length) {
            // Get token totalSupply.
            let totalSupply = null
            let decimals
            if (address) {
                let token = await db.Token.findOne({ hash: address })
                if (token) {
                    totalSupply = token.totalSupply
                    decimals = token.decimals
                }
            }
            let length = items.length
            let baseRank = (data.currentPage - 1) * data.perPage
            for (let i = 0; i < length; i++) {
                items[i] = await TokenHolderHelper.formatHolder(items[i], totalSupply, decimals)
                items[i]['rank'] = baseRank + i + 1
            }

            // Get tokens.
            let tokenHashes = []
            for (let i = 0; i < length; i++) {
                tokenHashes.push(items[i]['token'])
            }
            let tokens = await db.Token.find({ hash: { $in: tokenHashes } })
            if (tokens.length) {
                for (let i = 0; i < length; i++) {
                    for (let j = 0; j < tokens.length; j++) {
                        if (items[i]['token'] === tokens[j]['hash']) {
                            tokens[j].name = tokens[j]
                                .name
                                .replace(/\u0000/g, '') // eslint-disable-line no-control-regex
                                .trim()
                            tokens[j].symbol = tokens[j]
                                .symbol
                                .replace(/\u0004/g, '') // eslint-disable-line no-control-regex
                                .trim()
                            items[i]['tokenObj'] = tokens[j]
                        }
                    }
                }
            }
        }
        data.items = items

        return res.json(data)
    } catch (e) {
        logger.warn(e)
        return res.status(400).send()
    }
})

export default TokenHolderController
