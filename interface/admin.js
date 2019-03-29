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

app.route.post("/admin/api1", async function(req){
    var assetTypes = await new Promise((resolve)=>{
        let sql = `select count(*) as count from (select distinct companys.assetType from companys);`;
        app.sideChainDatabase.get(sql, [], (err, row)=>{
            if(err) resolve({
                isSuccess: false,
                message: JSON.stringify(err),
                result: {}
            });
            resolve({
                isSuccess: true,
                result: row
            });
        });
    }); 

    var allDapps = await app.model.Company.findAll({
        fields: ['dappid']
    })
    var sum = 0;
    for(i in allDapps){
        var totalIssued = await dappCall.call('POST', '/api/dapps/' + allDapps[i].dappid + '/totalCertsIssued', {});
        if(!totalIssued.isSuccess) continue;
        sum += totalIssued.totalCertificates;
    }
    return {
        isSuccess: true,
        countOfAssetTypes: assetTypes.result.count,
        countOfDapps: allDapps.length,
        countOfTotalIssued: sum
    }
})

app.route.post("/admin/api2", async function(req){
    var dappsRegistered = await new Promise((resolve)=>{
        let sql = `select mappings.email as ownerEmail, companys.* from companys join mappings on mappings.dappid = companys.dappid and role = 'superuser' order by companys.timestampp desc limit ?;`;
        app.sideChainDatabase.all(sql, [req.query.limit || 5], (err, row)=>{
            if(err) resolve({
                isSuccess: false,
                message: JSON.stringify(err),
                result: {}
            });
            resolve({
                isSuccess: true,
                result: row
            });
        });
    }); 

    for(i in dappsRegistered){
        var totalIssued = await dappCall.call('POST', '/api/dapps/' + dappsRegistered[i].dappid + '/totalCertsIssued', {});
        if(!totalIssued.isSuccess){
            dappsRegistered[i].totalCertificatesIssued = "Dapp Offline";
            continue;
        } 
        dappsRegistered[i].totalCertificatesIssued = totalIssued;
    }
    return {
        isSuccess: true,
        dappsRegistered: dappsRegistered
    }
})

app.route.post("/admin/api3", async function(req){
    var assetTypes = await new Promise((resolve)=>{
        let sql = `select companys.assetType, count(*) from companys group by companys.assetType order by companys.assetType asc;`;
        app.sideChainDatabase.all(sql, [], (err, row)=>{
            if(err) resolve({
                isSuccess: false,
                message: JSON.stringify(err),
                result: {}
            });
            resolve({
                isSuccess: true,
                result: row
            });
        });
    }); 

    for(i in assetTypes){
        var dapps = await app.model.Company.findAll({
            condition: {
                assetType: assetTypes[i]
            },
            fields: ['dappid']
        });
        var sum = 0;
        for(j in dapps){
            var totalIssued = await dappCall.call('POST', '/api/dapps/' + dapps[j].dappid + '/totalCertsIssued', {});
            if(!totalIssued.isSuccess) continue;
            sum += totalIssued.totalCertificates;
        }
        assetTypes[i].totalCertificatesIssued = sum;
    }
    return {
        isSuccess: true,
        assetTypes: assetTypes
    }
})

app.route.post("/admin/api4", async function(req){
    var first = new Date();
    var last = new Date();
    first.setHours(0);
    first.setMinutes(0);
    first.setSeconds(0);
    last.setHours(23);
    last.setMinutes(59);
    last.setSeconds(59);
    let sql = `select count(*) as count from (select companys.dappid from companys where companys.timestampp between ? and ?);`;

    var todayCount = await new Promise((resolve)=>{
        app.sideChainDatabase.get(sql, [first.getTime() ,last.getTime()], (err, row)=>{
            if(err) resolve({
                isSuccess: false,
                message: JSON.stringify(err),
                result: {}
            });
            resolve({
                isSuccess: true,
                result: row
            });
        });
    }); 
    var yesterdayCount = await new Promise((resolve)=>{
        app.sideChainDatabase.get(sql, [(new Date(first.getTime()).setDate(first.getDate()-1)).getTime() ,(new Date(last.getTime()).setDate(first.getDate()-1)).getTime()], (err, row)=>{
            if(err) resolve({
                isSuccess: false,
                message: JSON.stringify(err),
                result: {}
            });
            resolve({
                isSuccess: true,
                result: row
            });
        });
    }); 
    var lastWeekCount = await new Promise((resolve)=>{
        let sql = `select count(*) as count from (select companys.dappid from companys where companys.timestampp between ? and ?);`;
        app.sideChainDatabase.get(sql, [(new Date(first.getTime()).setDate(first.getDate()-7)).getTime() ,last.getTime()], (err, row)=>{ 
            if(err) resolve({
                isSuccess: false,
                message: JSON.stringify(err),
                result: {}
            });
            resolve({
                isSuccess: true,
                result: row
            });
        });
    }); 
    var lastMonthCount = await new Promise((resolve)=>{
        let sql = `select count(*) as count from (select companys.dappid from companys where companys.timestampp between ? and ?);`;
        app.sideChainDatabase.get(sql, [(new Date(first.getTime()).setMonth(first.getMonth()-1)).getTime() ,last.getTime()], (err, row)=>{ 
            if(err) resolve({
                isSuccess: false,
                message: JSON.stringify(err),
                result: {}
            });
            resolve({
                isSuccess: true,
                result: row
            });
        });
    }); 

    return {
        isSuccess: true,
        todayCount: todayCount,
        yesterdayCount: yesterdayCount,
        lastWeekCount: lastWeekCount,
        lastMonthCount: lastMonthCount
    }
});

app.route.post("/admin/api5", async function(req){
    var assetTypes = await new Promise((resolve)=>{
        let sql = `select companys.assetType, count(*) from companys group by companys.assetType order by companys.assetType asc;`;
        app.sideChainDatabase.all(sql, [], (err, row)=>{
            if(err) resolve({
                isSuccess: false,
                message: JSON.stringify(err),
                result: {}
            });
            resolve({
                isSuccess: true,
                result: row
            });
        });
    }); 

    for(i in assetTypes){
        var dapps = await app.model.Company.findAll({
            condition: {
                assetType: assetTypes[i]
            },
            fields: ['dappid']
        });
        var sum = 0;
        var offline = 0;
        var sumOfRegistered = 0;
        for(j in dapps){
            var totalIssued = await dappCall.call('POST', '/api/dapps/' + dapps[j].dappid + '/admin/workDetails', {});
            if(!totalIssued.isSuccess){
                offline++;
                continue;
            }
            sum += totalIssued.issuesCount;
            sumOfRegistered += totalIssued.recepientsCount;
        }
        assetTypes[i].totalCertificatesIssued = sum;
        assetTypes[i].totalInUse = dapps.length - offline;
        assetTypes[i].sumOfRegistered = sumOfRegistered;
    }
    return {
        isSuccess: true,
        assetTypes: assetTypes
    }
});

app.route.post("/admin/api6", async function(req){
    if(!req.query.assetType) return {
        isSuccess: false,
        message: "Please provide an assetType"
    }
    var dapps = await new Promise((resolve)=>{
        let sql = `select mappings.email, companys.timestampp, companys.dappid from companys join mappings on companys.dappid = mappings.dappid and role = 'superuser' where companys.assetType = ?;`;
        app.sideChainDatabase.all(sql, [req.query.assetType], (err, row)=>{
            if(err) resolve({
                isSuccess: false,
                message: JSON.stringify(err),
                result: {}
            });
            resolve({
                isSuccess: true,
                result: row
            });
        });
    });
    for(i in dapps){
        var details = await dappCall.call('POST', '/api/dapps/' + dapps[i].dappid + '/admin/workDetails', {});
        if(!details.isSuccess) {
            dapps[i].offline = true;
            continue;
        }
        dapps[i].issuersCount = details.issuersCount;
        dapps[i].authorizersCount = details.authorizerCount;
        dapps[i].recepientsCount = details.recepientsCount;
        dapps[i].issuesCount = details.issuesCount;
    }
    return {
        isSuccess: true,
        dapps: dapps
    }
});