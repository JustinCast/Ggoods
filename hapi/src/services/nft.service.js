const Boom = require('@hapi/boom')
const { BAD_REQUEST } = require('http-status-codes')

const {
  dgoodsUtil,
  hasuraUtil,
  ipfsUtil,
  axiosUtil,
  paypalUtil
} = require('../utils')

const vaultService = require('./vault.service')

const saveTemplate = async payload => {
  const mutation = `
    mutation ($payload: template_insert_input!) {
      template: insert_template_one(object: $payload) {
        id
      }
    }
    `
  const { template } = await hasuraUtil.request(mutation, {
    payload
  })

  return template
}

const getTemplate = async id => {
  const query = `
    query ($id: uuid!) {
      template: template_by_pk(id: $id) {
        id
        category
        name
        metadata
      }
    }
  `
  const { template } = await hasuraUtil.request(query, {
    id
  })

  return template
}

const createTemplate = async (user, payload) => {
  try {
    const password = await vaultService.getSecret(user.account)
    const transaction = await dgoodsUtil.create(user.account, password, payload)
    await saveTemplate({
      ...payload,
      account: user.account
    })

    return {
      trxid: transaction.transaction_id
    }
  } catch (error) {
    throw new Boom.Boom(error.message, {
      statusCode: BAD_REQUEST
    })
  }
}

const putOnSale = async (user, payload) => {
  try {
    const password = await vaultService.getSecret(user.account)
    const template = await getTemplate(payload.template)
    const ggoods = []

    for (let index = 0; index < payload.quantity; index++) {
      const { path: relativeUri } = await ipfsUtil.add(
        JSON.stringify({
          ...template.metadata,
          category: template.category,
          createdAt: new Date()
        })
      )
      const transaction = await dgoodsUtil.issue(user.account, password, {
        category: template.category,
        name: template.name,
        memo: payload.memo,
        relativeUri
      })

      const actionTraces = transaction.processed.action_traces.find(
        item => item.act.name === 'issue'
      )
      const inlineTraces = actionTraces.inline_traces.find(
        item => item.act.name === 'logcall'
      )
      const id = inlineTraces.act.data.dgood_id

      const listsalenftTransaction = await dgoodsUtil.listsalenft(
        user.account,
        password,
        {
          assets: [id],
          amount: payload.amount,
          donable: payload.donable
        }
      )
      ggoods.push({
        id,
        trxid: listsalenftTransaction.transaction_id
      })
    }

    return {
      ggoods
    }
  } catch (error) {
    throw new Boom.Boom(error.message, {
      statusCode: BAD_REQUEST
    })
  }
}

const confirmSaleWithPaypal = async (user, payload) => {
  try {
    const ggoods = []
    const order = await paypalUtil.getOrder(payload.orderId)

    for (let i = 0; i < order.purchase_units.length; i++) {
      const purchaseUnit = order.purchase_units[i]

      for (let j = 0; j < purchaseUnit.items.length; j++) {
        const item = purchaseUnit.items[j]
        const ggoodInfo = await dgoodsUtil.dgoodTableRowById(item.sku)
        const password = await vaultService.getSecret(ggoodInfo.owner)
        const transaction = await dgoodsUtil.confirmsale(
          ggoodInfo.owner,
          password,
          {
            newowner: user.account,
            quantity: `${item.unit_amount.value} ${item.unit_amount.currency_code}`,
            id: item.sku
          }
        )
        ggoods.push({
          id: item.sku,
          trxid: transaction.transaction_id
        })
      }
    }

    return {
      ggoods
    }
  } catch (error) {
    throw new Boom.Boom(error.message, {
      statusCode: BAD_REQUEST
    })
  }
}

// @todo: enabled pagination
const ggoodsOnSale = async (payload = {}) => {
  try {
    const items = await dgoodsUtil.asksTableRows(payload)
    const newItems = await Promise.all(
      items.map(async item => {
        const ggoodInfo = await dgoodsUtil.dgoodTableRowById(item.batch_id)
        const statsInfo = await dgoodsUtil.dgoodstatsTableRowByCategoryAndName({
          category: ggoodInfo.category,
          name: ggoodInfo.token_name
        })
        let metadata = {}

        try {
          const { data } = await axiosUtil.get(
            `${statsInfo.base_uri}/${ggoodInfo.relative_uri}`
          )
          metadata = data
        } catch (error) {}

        return {
          metadata,
          id: item.batch_id,
          issuer: statsInfo.issuer,
          owner: ggoodInfo.owner,
          serial: ggoodInfo.serial_number,
          seller: item.seller,
          amount: item.amount,
          donable: !!item.is_donable,
          expiration: item.expiration
        }
      })
    )

    return newItems.filter(item => !!item.metadata?.imageSmall)
  } catch (error) {
    throw new Boom.Boom(error.message, {
      statusCode: BAD_REQUEST
    })
  }
}

const ggoodOnSale = async id => {
  try {
    const item = await dgoodsUtil.asksTableRowById(id)

    if (!item) {
      return {}
    }

    const ggoodInfo = await dgoodsUtil.dgoodTableRowById(item.batch_id)
    const statsInfo = await dgoodsUtil.dgoodstatsTableRowByCategoryAndName({
      category: ggoodInfo.category,
      name: ggoodInfo.token_name
    })
    let metadata = {}

    try {
      const { data } = await axiosUtil.get(
        `${statsInfo.base_uri}/${ggoodInfo.relative_uri}`
      )
      metadata = data
    } catch (error) {}

    if (!metadata?.imageSmall) {
      return {}
    }

    return {
      metadata,
      id: item.batch_id,
      issuer: statsInfo.issuer,
      owner: ggoodInfo.owner,
      serial: ggoodInfo.serial_number,
      seller: item.seller,
      amount: item.amount,
      donable: !!item.is_donable,
      expiration: item.expiration
    }
  } catch (error) {
    throw new Boom.Boom(error.message, {
      statusCode: BAD_REQUEST
    })
  }
}

// @todo: enabled pagination
const myGGoods = async (user, payload) => {
  try {
    const items = await dgoodsUtil.dgoodTableRowsByOwner({
      owner: user.account,
      limit: payload.limit
    })
    const newItems = await Promise.all(
      items.map(async ggoodInfo => {
        let metadata = {}

        const statsInfo = await dgoodsUtil.dgoodstatsTableRowByCategoryAndName({
          category: ggoodInfo.category,
          name: ggoodInfo.token_name
        })

        try {
          const { data } = await axiosUtil.get(
            `${statsInfo.base_uri}/${ggoodInfo.relative_uri}`
          )

          metadata = data
        } catch (error) {}

        return {
          metadata,
          id: ggoodInfo.id,
          issuer: statsInfo.issuer,
          owner: ggoodInfo.owner,
          serial: ggoodInfo.serial_number
        }
      })
    )

    return newItems.filter(item => !!item.metadata?.imageSmall)
  } catch (error) {
    throw new Boom.Boom(error.message, {
      statusCode: BAD_REQUEST
    })
  }
}

module.exports = {
  createTemplate,
  putOnSale,
  confirmSaleWithPaypal,
  ggoodsOnSale,
  ggoodOnSale,
  myGGoods
}
