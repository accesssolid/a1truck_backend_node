const Users = require('../../models/Users');
const Stripe = require('stripe');
const stripe = Stripe(process.env.Stripe_Secret_Key);
const helpers = require('../../services/helper/index');
const messages = require('../Users/messages');
let ObjectId = require('mongodb').ObjectId
const CardUtils = {
    listCards: async (data) => {
        let { _id } = data?.decoded;
        if (!helpers.isValidId(_id)) {
          return helpers.showResponse(
            false,
            messages.NOT_VALIDID,
            null,
            null,
            statusCodes.success
          );
        }
        try {
            let result = await Users.findOne({ _id: ObjectId(_id) })
            console.log(result, _id)
            if (result.stripe_id && result.stripe_id != "") {
                const cards = await stripe.customers.listSources(
                    result.stripe_id,
                    { object: 'card' }
                );
                return helpers.showResponse(true, messages.DATA_FOUND_SUCCESS, cards?.data, null, 200);
            }
            else {
                return helpers.showResponse(false, "No customer id found", [], null, 200);
            }
        }
        catch (err) {
            return helpers.showResponse(false, err.message, null, null, 200);
        }
    },
    addCard: async ( data) => {
    //     CardUtils.createStriptokens()
    //   return
        try {
            let { _id } = data?.decoded;
            if (!helpers.isValidId(_id)) {
              return helpers.showResponse(
                false,
                messages.NOT_VALIDID,
                null,
                null,
                statusCodes.success
              );
            }
            let result = await Users.findOne({ _id: ObjectId(_id) })
            console.log(result, _id)
            if (result.stripe_id && result.stripe_id != "") {
                const card = await stripe.customers.createSource(
                    result.stripe_id,
                    { source: data?.body?.token }
                );
                return helpers.showResponse(true, messages.CARD_ADDED_SUCCESS, card, null, 200);
            }
            else {
                return helpers.showResponse(false, "No customer id found", [], null, 200);
            }
        }
        catch (err) {
            return helpers.showResponse(false, err.message, null, null, 200);
        }
    },
    retrieveCustomer: async (user_id, body) => {
        try {
            let result = await Users.findOne({ _id: ObjectId(user_id) })
            console.log(result, user_id)
            if (result.stripe_id && result.stripe_id != "") {
                const customer = await stripe.customers.retrieve(
                    result.stripe_id
                );
                return helpers.showResponse(true, "Success", customer, null, 200);
            }
            else {
                return helpers.showResponse(false, "No customer id found", {}, null, 200);

            }
        }
        catch (err) {
            return helpers.showResponse(false, err.message, null, null, 200);
        }
    },
    updateCustomer: async (data) => {
        let { _id } = data?.decoded;
        if (!helpers.isValidId(_id)) {
          return helpers.showResponse(
            false,
            messages.NOT_VALIDID,
            null,
            null,
            statusCodes.success
          );
        }
        try {
            let result = await Users.findOne({ _id: ObjectId(_id) })
            console.log(result, _id)
            if (result.stripe_id && result.stripe_id != "") {
                const customer = await stripe.customers.update(
                    result.stripe_id,
                    { ...data?.body }
                );
                return helpers.showResponse(true, "Success", customer, null, 200);
            }
            else {
                return helpers.showResponse(false, "No customer id found", {}, null, 200);

            }
        }
        catch (err) {
            return helpers.showResponse(false, err.message, null, null, 200);
        }
    },
    deleteCard: async (data) => {
        let { _id } = data?.decoded;
        if (!helpers.isValidId(_id)) {
          return helpers.showResponse(
            false,
            messages.NOT_VALIDID,
            null,
            null,
            statusCodes.success
          );
        }
        try {
            let result = await Users.findOne({ _id: ObjectId(_id) })
            console.log(result, _id)
            if (result.stripe_id && result.stripe_id != "") {
                const deleted = await stripe.customers.deleteSource(
                    result.stripe_id,
                    data?.body.card_id
                );

                return helpers.showResponse(true, messages.CARD_DELETED_SUCCESS, deleted, null, 200);
            }
            else {
                return helpers.showResponse(false, "No customer id found", [], null, 200);
            }
        }
        catch (err) {
            return helpers.showResponse(false, err.message, null, null, 200);
        }
    },
    // createStriptokens: async (user_id) => {
    //     let params={
    // card:{
    //   number:"4242424242424242",
    //   exp_month:2,
    //   exp_year:2024,
    //   cvc:"123"
    // }
    //     }
    //     const striptoken = await stripe.tokens.create(params);
    //     console.log('striptoken', striptoken)
    //     return
  
    //   },
 
}
module.exports = { ...CardUtils }
// stripe_id