const express = require('express')
const Router = express.Router()
const sql = require('mssql')
const config = require('../settings.json').SQLConfig
const tokenParsing = require('../lib/tokenParsing')

Router.get('/users/daily/:date', async (req, res) => {
    // Check token using toUid function
    let { uid, isAdmin, permissions } = await tokenParsing.checkPermissions(req.headers.authorization)
        .catch(er => { return { errored: true, er } })
    if (uid.errored) return res.status(401).json({ message: 'bad authorization token' })
    if (!isAdmin && !permissions.view_reports) return res.status(401).json({ message: 'missing permission' })

    // Get Date
    const date = req.params.date
    if (!date) return res.status(400).json({ message: 'No date provided' })

    // Establish SQL Connection
    let pool = await sql.connect(config)

    // Get Job Codes
    let jobs_query = await pool.request().query(`SELECT * FROM jobs`)
        .catch(er => { return { isErrored: true, error: er } })
    if (jobs_query.isErrored) return res.status(500).json({ message: 'failed Job query' })
    const hourly_jobs = {}
    const ppd_jobs = {}
    for (let i of jobs_query.recordset) if (i.is_hourly) hourly_jobs[i.id] = i.price; else ppd_jobs[i.id] = i.price

    // Get asset and hourly history for the date
    const dailyDollars = {}
    let asset_query = await pool.request().query(`SELECT user_id, job_code FROM asset_tracking WHERE date = '${date}'`)
        .catch(er => { return { isErrored: true, error: er } })
    if (asset_query.isErrored) return res.status(500).json({ message: asset_query.error })

    let hourly_query = await pool.request().query(`SELECT user_id, job_code, hours FROM hourly_tracking WHERE date = '${date}'`)
        .catch(er => { return { isErrored: true, error: er } })
    if (hourly_query.isErrored) return res.status(500).json({ message: hourly_query.error })

    for (let i of asset_query.recordset) dailyDollars[i.user_id] ? dailyDollars[i.user_id] += parseFloat(ppd_jobs[i.job_code]) : dailyDollars[i.user_id] = parseFloat(ppd_jobs[i.job_code])
    for (let i of hourly_query.recordset) dailyDollars[i.user_id] ? dailyDollars[i.user_id] += parseFloat(hourly_jobs[i.job_code]) * parseFloat(i.hours) : dailyDollars[i.user_id] = parseFloat(hourly_jobs[i.job_code]) * parseFloat(i.hours)
    // Get names associated with uid
    let name_query = await pool.request().query(`SELECT name, id FROM users`)
        .catch(er => { return { isErrored: true, error: er } })
    if (name_query.isErrored) return res.status(500).json({ message: name_query.error })

    // Organize Data
    const d = []
    let ddKeys = Object.keys(dailyDollars)
    for (let i of name_query.recordset) if (ddKeys.includes(`${i.id}`)) d.push({ id: i.id, name: i.name, dailydollars: dailyDollars[i.id] })

    return res.status(200).json(d)
})

Router.get('/user/:uid/:date', async (req, res) => {
    let { uid, isAdmin, permissions } = await tokenParsing.checkPermissions(req.headers.authorization)
        .catch(er => { return { errored: true, er } })
    if (uid.errored) return res.status(401).json({ message: 'bad authorization token' })
    if (!isAdmin && !permissions.view_reports) return res.status(401).json({ message: 'missing permission' })

    // Establish SQL Connection
    let pool = await sql.connect(config)

    // Get Date
    const date = req.params.date
    if (!date) return res.status(400).json({ message: 'No date provided' })

    // Data validation for UID. Check for UID, and Check if UID exists
    uid = req.params.uid
    if (!uid || uid == '') return res.status(400).json({ message: 'No UID given' })
    let resu = await pool.request().query(`SELECT id FROM users WHERE id = ${uid}`).catch(er => { return `Invalid UID` })
    if (resu == 'Invalid UID') return res.status(400).json({ message: 'Invalid UID or not found' })

    // Get Data

    // Combining these into a single query is out of my knowledge level, so I'm breaking it up into multiple
    let asset_tracking = await pool.request().query(`SELECT job_code FROM asset_tracking WHERE user_id = '${uid}' AND date = '${date}'`)
        .catch(er => { console.log(er); return { isErrored: true, error: er } })
    if (asset_tracking.isErrored) {
        // Check for specific errors

        // If no errors above, return generic Invalid UID Error
        return res.status(400).json({ message: 'Invalid UID or not found, Asset Tracking Query Error' })
    }

    let hourly_tracking = await pool.request().query(`SELECT job_code, hours FROM hourly_tracking WHERE user_id = '${uid}' AND date = '${date}'`)
        .catch(er => { return { isErrored: true, error: er } })
    if (hourly_tracking.isErrored) {
        // Check for specific errors

        // If no errors above, return generic Invalid UID Error
        return res.status(400).json({ message: 'Invalid UID or not found, Hourly Tracking Query Error' })
    }

    let job_codes = await pool.request().query(`SELECT * FROM jobs`)
        .catch(er => { return { isErrored: true, error: er } })
    if (hourly_tracking.isErrored) return res.status(500).json({ code: 500, message: 'Failed to get job codes' })

    // Format Job Codes
    let hourly_jobs = {}, ppd_jobs = {}
    job_codes.recordset.forEach(job => {
        if (job.status_only) return
        if (job.is_hourly) hourly_jobs[job.id] = { job_name: job.job_name, job_code: job.job_code, price: job.price }
        else ppd_jobs[job.id] = { job_name: job.job_name, job_code: job.job_code, price: job.price }
    })

    // Put data where data should be
    let data = { "Daily Dollars": 0 }

    asset_tracking.recordset.forEach(ppd => {
        if (!ppd_jobs[ppd.job_code]) return
        let job_name = 'ppd_' + ppd_jobs[ppd.job_code].job_name
        if (!job_name) return
        if (data[job_name]) { data[job_name].count = data[job_name].count + 1; data[job_name].dd += ppd_jobs[ppd.job_code].price }
        else data[job_name] = { count: 1, dd: ppd_jobs[ppd.job_code].price }
        data["Daily Dollars"] += ppd_jobs[ppd.job_code].price
    })

    hourly_tracking.recordset.forEach(hourly => {
        if (!hourly_jobs[hourly.job_code]) return
        let job_name = 'hrly_' + hourly_jobs[hourly.job_code].job_name
        if (!job_name) return
        if (data[job_name]) { data[job_name].count = data[job_name].count + hourly.hours; data[job_name].dd += hourly_jobs[hourly.job_code].price * hourly.hours }
        else data[job_name] = { count: hourly.hours, is_hourly: true, dd: hourly_jobs[hourly.job_code].price * hourly.hours }
        data["Daily Dollars"] += hourly_jobs[hourly.job_code].price * hourly.hours
    })

    return res.status(200).json(data)
})

Router.get('/graph/user/:uid/:from/:to', async (req, res) => {
    let { uid, isAdmin, permissions } = await tokenParsing.checkPermissions(req.headers.authorization)
        .catch(er => { return { errored: true, er } })
    if (uid.errored) return res.status(401).json({ message: 'bad authorization token' })
    if (!isAdmin && !permissions.view_reports) return res.status(401).json({ message: 'missing permission' })

    // Establish SQL Connection
    let pool = await sql.connect(config)

    // Get and check UID
    uid = req.params.uid
    let from = req.params.from
    let to = req.params.to
    if (!uid || uid == '') return res.status(400).json({ message: 'No UID given' })
    let resu = await pool.request().query(`SELECT id FROM users WHERE id = ${uid}`).catch(er => { return `Invalid UID` })
    if (resu == 'Invalid UID') return res.status(400).json({ message: 'Invalid UID or not found' })

    // Get Job Codes
    let jobs_query = await pool.request().query(`SELECT * FROM jobs`)
        .catch(er => { return { isErrored: true, error: er } })
    if (jobs_query.isErrored) return res.status(500).json({ message: 'failed Job query' })
    const hourly_jobs = {}
    const ppd_jobs = {}
    for (let i of jobs_query.recordset) if (i.is_hourly) hourly_jobs[i.id] = parseFloat(i.price); else ppd_jobs[i.id] = parseFloat(i.price)

    // Get asset and hourly history for the date
    let asset_query = await pool.request().query(`SELECT job_code, date FROM asset_tracking WHERE user_id = '${uid}' AND date BETWEEN '${from}' AND '${to}'`)
        .catch(er => { return { isErrored: true, error: er } })
    if (asset_query.isErrored) return res.status(500).json({ message: asset_query.error })

    let hourly_query = await pool.request().query(`SELECT job_code, hours, date FROM hourly_tracking WHERE user_id = '${uid}' AND date BETWEEN '${from}' AND '${to}'`)
        .catch(er => { return { isErrored: true, error: er } })
    if (hourly_query.isErrored) return res.status(500).json({ message: hourly_query.error })

    let data = {}

    for (let i of asset_query.recordset) if (data[i.date]) data[i.date] += ppd_jobs[i.job_code]; else data[i.date] = ppd_jobs[i.job_code]

    for (let i of hourly_query.recordset) if (data[i.date]) data[i.date] += parseFloat(i.hours) * hourly_jobs[i.job_code]; else data[i.date] = parseFloat(i.hours) * hourly_jobs[i.job_code]

    return res.status(200).json(data)
})

// Modified Asset and Hourly Routes for use of report editors
Router.get('/asset/user/:uid/:date', async (req, res) => {
    // Validate requestor and check their permissions
    let { uid, isAdmin, permissions } = await tokenParsing.checkPermissions(req.headers.authorization)
        .catch(er => { return { errored: true, er } })
    if (uid.errored) return res.status(401).json({ message: 'bad authorization token' })
    if (!isAdmin && !permissions.edit_others_worksheets) return res.status(401).json({ message: 'Access Denied' })

    // Get UID from params
    uid = req.params.uid

    //Get date from params
    let date = req.params.date

    // Establish SQL Connection
    let pool = await sql.connect(config)

    // Get Data
    let asset_tracking = await pool.request().query(`SELECT * FROM asset_tracking WHERE user_id = '${uid}' AND date = '${getDate(date)}'`)
        .catch(er => { console.log(er); return { isErrored: true, error: er } })
    if (asset_tracking.isErrored) {
        // Check for specific errors

        // If no errors above, return generic Invalid UID Error
        return res.status(400).json({ message: 'Invalid UID or not found, Asset Tracking Query Error' })
    }

    // Organize Data
    let data = {
        records: asset_tracking.recordset
    }

    // Return Data
    return res.status(200).json(data)
})

Router.post('/asset/user/:uid/new', async (req, res) => {
    // Validate requestor and check their permissions
    let { uid, isAdmin, permissions } = await tokenParsing.checkPermissions(req.headers.authorization)
        .catch(er => { return { errored: true, er } })
    if (uid.errored) return res.status(401).json({ message: 'bad authorization token' })
    if (!isAdmin && !permissions.edit_others_worksheets) return res.status(401).json({ message: 'Access Denied' })

    // Get UID from params
    uid = req.params.uid

    // Get Params
    const data = req.body;
    let { date, job_code, asset_id, notes } = data

    // Establish SQL Connection
    let pool = await sql.connect(config)

    // Validate Data
    let errored = false
    let issues = []
    if (!date || date.replace(/\d{4}-\d{2}-\d{2}/g, '') !== '') {
        errored = true
        issues.push('Issue with Date format/ Invalid Date')
    }
    if (!job_code || (typeof (job_code) == 'string' && job_code.replace(/\d/gi, '') !== '')) {
        errored = true
        issues.push('Invalid Job Code or Job Code not type Int')
    }
    if (!asset_id) {
        errored = true
        issues.push('Asset ID not provided')
    }
    if (errored) return res.status(400).json({ message: 'Unsuccessful', issues: issues })

    // Send to DB
    let result = await pool.request().query(`INSERT INTO asset_tracking (user_id, asset_id, job_code, date, notes) VALUES ('${uid}', '${asset_id}', '${job_code}', '${date}', ${notes ? `'${notes}'` : 'null'})`)
        .catch(er => { console.log(er); return { isErrored: true, error: er } })
    if (result.isErrored) {
        return res.status(400).json({ message: 'Unsuccessful', error: result.error })
    }

    // Return
    return res.status(200).json({ message: 'Success' })
})

Router.post('/asset/user/:uid/edit', async (req, res) => {
    // Validate requestor and check their permissions
    let { uid, isAdmin, permissions } = await tokenParsing.checkPermissions(req.headers.authorization)
        .catch(er => { return { errored: true, er } })
    if (uid.errored) return res.status(401).json({ message: 'bad authorization token' })
    if (!isAdmin && !permissions.edit_others_worksheets) return res.status(401).json({ message: 'Access Denied' })

    // Get Params
    uid = req.params.uid
    const data = req.body;
    let { id, change, value } = data

    // Establish SQL Connection
    let pool = await sql.connect(config)

    // Validate Data
    let errored = false
    let issues = []
    if (!id || (typeof (id) == 'string' && id.replace(/\d/gi, '') !== '')) {
        errored = true
        issues.push(`Invalid History ID`)
    }
    switch (typeOfs[change]) {
        case 'date':
            if (!value || value.replace(/\d{4}-\d{2}-\d{2}/g, '') !== '') {
                errored = true
                issues.push('Issue with Date format/ Invalid Date')
            }
            break;
        case 'asset': //no data validation yet
            break;
        case 'null': //no data validation
            break;
    }
    if (errored) return res.status(400).json({ message: 'Unsuccessful', issues: issues })
    if (!typeOfToColumn[change]) return res.status(500).json({ message: 'Unsuccessful', issues: 'Unknown column name to change' })

    // Send to DB
    let result = await pool.request().query(`UPDATE asset_tracking SET ${typeOfToColumn[change]} = '${value}' WHERE id = '${id}' AND user_id = '${uid}'`)
        .catch(er => { console.log(er); return { isErrored: true, error: er } })
    if (result.isErrored) {
        return res.status(400).json({ message: 'Unsuccessful', error: result.error })
    }

    // Return
    return res.status(200).json({ message: 'Success' })
})

Router.delete('/asset/user/:uid/del/:id/:date', async (req, res) => {
    // Validate requestor and check their permissions
    let { uid, isAdmin, permissions } = await tokenParsing.checkPermissions(req.headers.authorization)
        .catch(er => { return { errored: true, er } })
    if (uid.errored) return res.status(401).json({ message: 'bad authorization token' })
    if (!isAdmin && !permissions.edit_others_worksheets) return res.status(401).json({ message: 'Access Denied' })

    // Get params
    uid = req.params.uid
    const id = req.params.id
    const date = req.params.date

    // Establish SQL Connection
    let pool = await sql.connect(config)

    // Data validation for UID. Check for UID, and Check if UID exists
    if (!uid || uid == '') return res.status(400).json({ message: 'No UID given' })
    let resu = await pool.request().query(`SELECT id FROM users WHERE id = ${uid}`).catch(er => { return `Invalid UID` })
    if (resu == 'Invalid UID') return res.status(400).json({ message: 'Invalid UID or not found' })

    if (!id || id == '') return res.status(400).json({ message: 'No ID given' })
    resu = await pool.request().query(`SELECT id FROM asset_tracking WHERE id = ${id}`).catch(er => { return `Invalid ID` })
    if (resu == 'Invalid ID') return res.status(400).json({ message: 'Invalid ID or not found' })

    let asset_tracking = await pool.request().query(`DELETE FROM asset_tracking WHERE id = '${id}' AND user_id = '${uid}' AND date = '${getDate(date)}'`)
        .catch(er => { console.log(er); return { isErrored: true, error: er } })
    if (asset_tracking.isErrored) {
        // Check for specific errors

        // If no errors above, return generic Invalid UID Error
        return res.status(400).json({ message: 'Invalid UID or not found, Asset Tracking Query Error' })
    }

    // Return Data
    return res.status(200).json({ message: 'Success' })
})
// Done Assets, begin hourly

Router.get('/hourly/user/:uid/:date', async (req, res) => {
    // Validate requestor and check their permissions
    let { uid, isAdmin, permissions } = await tokenParsing.checkPermissions(req.headers.authorization)
        .catch(er => { return { errored: true, er } })
    if (uid.errored) return res.status(401).json({ message: 'bad authorization token' })
    if (!isAdmin && !permissions.edit_others_worksheets) return res.status(401).json({ message: 'Access Denied' })

    // Get UID from header
    uid = req.params.uid

    //Get date from header
    let date = req.params.date

    // Establish SQL Connection
    let pool = await sql.connect(config)

    // Get Data

    // Combining these into a single query is out of my knowledge level, so I'm breaking it up into multiple
    let hourly_tracking = await pool.request().query(`SELECT * FROM hourly_tracking WHERE user_id = '${uid}' AND date = '${getDate(date)}'`)
        .catch(er => { console.log(er); return { isErrored: true, error: er } })
    if (hourly_tracking.isErrored) {
        // Check for specific errors

        // If no errors above, return generic Invalid UID Error
        return res.status(400).json({ message: 'Invalid UID or not found, Asset Tracking Query Error' })
    }

    // Organize Data
    let data = {
        records: hourly_tracking.recordset
    }

    // Return Data
    return res.status(200).json(data)
})

Router.post('/hourly/user/:uid/new', async (req, res) => {
    // Validate requestor and check their permissions
    let { uid, isAdmin, permissions } = await tokenParsing.checkPermissions(req.headers.authorization)
        .catch(er => { return { errored: true, er } })
    if (uid.errored) return res.status(401).json({ message: 'bad authorization token' })
    if (!isAdmin && !permissions.edit_others_worksheets) return res.status(401).json({ message: 'Access Denied' })

    // Get Params
    uid = req.params.uid
    const data = req.body;
    let { date, job_code, startTime, endTime, total_hours, notes } = data

    // Establish SQL Connection
    let pool = await sql.connect(config)

    // Validate Data
    let errored = false
    let issues = []
    if (!date || date.replace(/\d{4}-\d{2}-\d{2}/g, '') !== '') {
        errored = true
        issues.push('Issue with Date format/ Invalid Date')
    }
    if (!startTime || startTime.replace(/\d+:\d{2}/g, '') !== '' || parseInt(startTime.split(':')[0] > 24) || parseInt(startTime.split(':')[1] > 45) || parseInt(startTime.split(':')[1]) % 15 !== 0) {
        errored = true
        issues.push('Issue with Start Time')
    }
    if (!endTime || endTime.replace(/\d+:\d{2}/g, '') !== '' || parseInt(endTime.split(':')[0] > 24) || parseInt(endTime.split(':')[1] > 45) || parseInt(endTime.split(':')[1]) % 15 !== 0) {
        errored = true
        issues.push('Issue with End Time')
    }
    if (!total_hours || `${total_hours}`.replace(/[\d.]/g, '') !== '') {
        errored = true
        issues.push('Issue with Total Hours')
    }
    if (!job_code || (typeof (job_code) == 'string' && job_code.replace(/\d/gi, '') !== '')) {
        errored = true
        issues.push('Invalid Job Code or Job Code not type Int')
    }
    if (errored) return res.status(400).json({ message: 'Unsuccessful', issues: issues })

    // Send to DB
    let result = await pool.request().query(`INSERT INTO hourly_tracking (job_code, user_id, start_time, end_time, notes, hours, date) VALUES ('${job_code}', '${uid}', '${startTime}', '${endTime}', ${notes ? `'${notes}'` : 'null'}, '${total_hours}', '${date}')`)
        .catch(er => { console.log(er); return { isErrored: true, error: er } })
    if (result.isErrored) {
        return res.status(400).json({ message: 'Unsuccessful', error: result.error })
    }

    // Return
    return res.status(200).json({ message: 'Success' })
})

Router.post('/hourly/user/:uid/edit', async (req, res) => {
    // Validate requestor and check their permissions
    let { uid, isAdmin, permissions } = await tokenParsing.checkPermissions(req.headers.authorization)
        .catch(er => { return { errored: true, er } })
    if (uid.errored) return res.status(401).json({ message: 'bad authorization token' })
    if (!isAdmin && !permissions.edit_others_worksheets) return res.status(401).json({ message: 'Access Denied' })

    // Get Params
    uid = req.params.uid
    const data = req.body;
    let { id, change, value, total_hours } = data

    // Establish SQL Connection
    let pool = await sql.connect(config)

    // Validate Data
    let errored = false
    let issues = []
    if (!id || (typeof (id) == 'string' && id.replace(/\d/gi, '') !== '')) {
        errored = true
        issues.push(`Invalid History ID`)
    }
    switch (change) {
        case 'date':
            if (!value || value.replace(/\d{4}-\d{2}-\d{2}/g, '') !== '') {
                errored = true
                issues.push('Issue with Date format/ Invalid Date')
            }
            break;
        case 'asset': //no data validation yet
            break;
        case 'null': //no data validation
            break;
    }
    if (errored) return res.status(400).json({ message: 'Unsuccessful', issues: issues })
    if (!typeOfToColumn[change]) return res.status(500).json({ message: 'Unsuccessful', issues: 'Unknown column name to change' })

    // Send to DB
    let result = await pool.request().query(`UPDATE hourly_tracking SET ${typeOfToColumn[change]} = '${value}'${total_hours ? `, hours = ${total_hours}` : ''} WHERE id = '${id}' AND user_id = '${uid}'`)
        .catch(er => { console.log(er); return { isErrored: true, error: er } })
    if (result.isErrored) {
        return res.status(400).json({ message: 'Unsuccessful', error: result.error })
    }

    // Return
    return res.status(200).json({ message: 'Success' })
})

Router.delete('/hourly/user/:uid/del/:id/:date', async (req, res) => {
    // Validate requestor and check their permissions
    let { uid, isAdmin, permissions } = await tokenParsing.checkPermissions(req.headers.authorization)
        .catch(er => { return { errored: true, er } })
    if (uid.errored) return res.status(401).json({ message: 'bad authorization token' })
    if (!isAdmin && !permissions.edit_others_worksheets) return res.status(401).json({ message: 'Access Denied' })

    // Get Params
    uid = req.params.uid
    const id = req.params.id
    const date = req.params.date

    // Establish SQL Connection
    let pool = await sql.connect(config)

    // Data validation for UID. Check for UID, and Check if UID exists
    if (!uid || uid == '') return res.status(400).json({ message: 'No UID given' })
    let resu = await pool.request().query(`SELECT id FROM users WHERE id = ${uid}`).catch(er => { return `Invalid UID` })
    if (resu == 'Invalid UID') return res.status(400).json({ message: 'Invalid UID or not found' })

    if (!id || id == '') return res.status(400).json({ message: 'No ID given' })
    resu = await pool.request().query(`SELECT id FROM hourly_tracking WHERE id = ${id}`).catch(er => { return `Invalid ID` })
    if (resu == 'Invalid ID') return res.status(400).json({ message: 'Invalid ID or not found' })

    let hourly_tracking = await pool.request().query(`DELETE FROM hourly_tracking WHERE id = '${id}' AND user_id = '${uid}' AND date = '${getDate(date)}'`)
        .catch(er => { console.log(er); return { isErrored: true, error: er } })
    if (hourly_tracking.isErrored) {
        // Check for specific errors

        // If no errors above, return generic Invalid UID Error
        return res.status(400).json({ message: 'Invalid UID or not found, Asset Tracking Query Error' })
    }

    // Return Data
    return res.status(200).json({ message: 'Success' })
})

Router.post('/generate', async (req, res) => {
    const { uid, isAdmin, permissions } = await tokenParsing.checkPermissions(req.headers.authorization)
        .catch(er => { return { errored: true, er } })
    if (uid.errored) return res.status(401).json({ message: 'bad authorization token' })
    if (!isAdmin && !permissions.edit_others_worksheets) return res.status(401).json({ message: 'Access Denied' })

    const { date, range } = req.body

    console.log(date, range)
    console.log(`SELECT * FROM asset_tracking WHERE ${range ? `date >= '${date}' AND date <= '${range}'` : `date = '${date}'`}`)

    // Establish SQL Connection
    let pool = await sql.connect(config)

    let asset_tracking_query = await pool.request().query(`SELECT * FROM asset_tracking WHERE ${range ? `date >= '${date}' AND date <= '${range}'` : `date = '${date}'`}`)
        .then(d => d.recordset)
        .catch(er => { console.log(er); return { isErrored: true, error: er } })
    if (asset_tracking_query && asset_tracking_query.isErrored) return res.status(500).json({ message: 'Error fetching asset tracking records' })

    let hourly_tracking_query = await pool.request().query(`SELECT * FROM hourly_tracking WHERE ${range ? `date >= '${date}' AND date <= '${range}'` : `date = '${date}'`}`)
        .then(d => d.recordset)
        .catch(er => { console.log(er); return { isErrored: true, error: er } })
    if (hourly_tracking_query && hourly_tracking_query.isErrored) return res.status(500).json({ message: 'Error fetching hourly tracking records' })

    if (!asset_tracking_query && !hourly_tracking_query) return res.status(409).json({ message: 'No data to report on' })

    // Get user name object
    let usernames = {}
    let user_query = await pool.request().query(`SELECT id,name FROM users`)
        .catch(er => { console.log(er); return { isErrored: true, error: er } })
    if (user_query.isErrored) return res.status(500).json({ message: 'Error fetching users' })
    for (let i of user_query.recordset) usernames[i.id] = i.name


    // Get Job Code Names
    let job_codes = {}
    let job_code_query = await pool.request().query(`SELECT id,job_code,price FROM jobs`)
        .catch(er => { console.log(er); return { isErrored: true, error: er } })
    if (job_code_query.isErrored) return res.status(500).json({ message: 'Error fetching job codes' })
    for (let i of job_code_query.recordset) job_codes[i.id] = { name: i.job_code, price: i.price }


    // The fun stuff :)
    let data = []

    /**
     * Data
     * [
     *  [name]
     *  ['Job Code', total-count, total-$, Date-Count, $, repeat for each date in range]
     *  [do for each job code used by the user]
     *  [break]
     *  [next person]
     * ]
     */

    let applicableUsers = new Set()
    if (asset_tracking_query) for (let i of asset_tracking_query) applicableUsers.add(i.user_id)
    if (hourly_tracking_query) for (let i of hourly_tracking_query) applicableUsers.add(i.user_id)

    function getUserData(id) {
        let d = []

        // Get list of dates
        let dates = []
        if (range) {
            let start = new Date(date)
            let end = new Date(range)
            while (start <= end) {
                dates.push(new Date(start))
                start = start.addDays(1)
            }
        }

        // Start off the CSV Data
        d.push([usernames[id] || id])
        d.push(['Job Code'])

        if (range) {
            d[1].push('Total Count', 'Total Revenue')
            for (let i of dates) {
                let s = i.toISOString().split('T')[0].substring(5)
                d[1].push(`${s} #`, `${s} $`)
            }
        } else {
            d[1].push(`Count`, 'Revenue')
        }

        let assetJobCodes = new Set()
        let hourlyJobCodes = new Set()
        if (asset_tracking_query) for (let i of asset_tracking_query) if (i.user_id == id) assetJobCodes.add(i.job_code)
        if (hourly_tracking_query) for (let i of hourly_tracking_query) if (i.user_id == id) hourlyJobCodes.add(i.job_code)


        assetJobCodes.forEach(jc => {
            //count totals
            if (range) {
                let row = [job_codes[jc].name, 0, 0]
                let totCount = 0
                for (let d of dates) {
                    console.log(d)
                    let count = 0
                    for (let i of asset_tracking_query)
                        if (i.user_id == id && i.date.toISOString().split('T')[0] == d.toISOString().split('T')[0] && i.job_code == jc) count++
                    row.push(count, parseFloat(job_codes[jc].price) * parseFloat(count))
                    totCount += count
                }
                row[1] = totCount
                row[2] = parseFloat(job_codes[jc].price) * parseFloat(totCount)
                d.push(row)
            }
            else {
                let count = 0
                for (let i of asset_tracking_query)
                    if (i.user_id == id && i.date.toISOString().split('T')[0] == date && i.job_code == jc) count++
                d.push([job_codes[jc].name, count, parseFloat(job_codes[jc].price) * parseFloat(count)])
            }
        })

        hourlyJobCodes.forEach(jc => {
            //count totals
            if (range) {
                let row = [job_codes[jc].name, 0, 0]
                let totCount = 0
                for (let d of dates) {
                    console.log(d)
                    let count = 0
                    for (let i of hourly_tracking_query)
                        if (i.user_id == id && i.date.toISOString().split('T')[0] == d.toISOString().split('T')[0] && i.job_code == jc) count++
                    row.push(count, parseFloat(job_codes[jc].price) * parseFloat(count))
                    totCount += count
                }
                row[1] = totCount
                row[2] = parseFloat(job_codes[jc].price) * parseFloat(totCount)
                d.push(row)
            }
            else {
                let count = 0
                for (let i of hourly_tracking_query)
                    if (i.user_id == id && i.date.toISOString().split('T')[0] == date && i.job_code == jc) count++
                d.push([job_codes[jc].name, count, parseFloat(job_codes[jc].price) * parseFloat(count)])
            }
        })

        return d
    }

    applicableUsers.forEach(u => data.push(...getUserData(u), [], []))

    return res.status(200).json({ data })
})


module.exports = Router

function getDate(date) {
    date = new Date(date)
    return date.toISOString().split('T')[0]
}