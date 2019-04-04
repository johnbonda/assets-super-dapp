app.route.post("/companysTable", async function(req){
    app.sdb.create("company", {
        dappid: req.query.dappid,
        company: req.query.company,
        country: req.query.country,
        name: req.query.name,
        assetType: req.query.assetType,
        dappOwner: req.query.dappOwner,
        timestampp: new Date().getTime()
    })
})