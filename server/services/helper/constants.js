const constValues={
    user_delete:0,
    user_active:1,
    user_block:2,
    faq_delete:0,
    faq_active:1,
    faq_disable:2,
    vehicle_delete:0,
    vehicle_active:1,
    User_unverified:0,
    User_verified:1,
    notification_on:1,
    notification_off:2,
}
const statusCodes={
    success:200,
    createdsuccess:201,
    nocontent:204,
    badreq:400,
    unauthorized:401,
    forbidden:403,
    notfound:404,
    servererror:500
}


module.exports={
    constValues,
    statusCodes
}