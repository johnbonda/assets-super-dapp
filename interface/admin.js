var dappCall = require('../utils/dappCall');


app.route.post('/getCompanies', async function(req, cb){
    var companies = await app.model.Company.findAll({});
    return {
        companies: companies,
        isSuccess: true
    }
});

app.route.post('/company/data', async function(req, cb){
    var company = await app.model.Company.findOne({
        condition: {
            company: req.query.company
        }
    });
    if(!company) return {
        message: "Company doesn't exists",
        isSuccess: false
    }

    var superAdmin = await app.model.Mapping.findOne({
        condition: {
            dappid: company.dappid,
            role: 'superuser'
        },
        fields: ['email']
    });
    var authorizerCount = await app.model.Mapping.count({
        dappid: company.dappid,
        role: 'authorizer'
    });
    var issuerCount = await app.model.Mapping.count({
        dappid: company.dappid,
        role: 'issuer'
    })

    var totalIssued = await dappCall.call('POST', '/api/dapps/' + company.dappid + '/totalCertsIssued', {}) 
    if(!totalIssued)
        totalIssued = "Dapp offline"

    return {
        superuser: superAdmin.email,
        authorizerCount: authorizerCount,
        issuerCount: issuerCount,
        totalIssued: totalIssued.totalCertificates,
        isSuccess: true
    }
});