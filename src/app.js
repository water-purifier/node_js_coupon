const express = require('express');
const db = require('./models');
const bodyParser = require("body-parser");
const jwt = require('jsonwebtoken');

function generateJWT(user_id) {
    const payload = {
        user_id: user_id,
    };
    const secret = "any_string_this_into_config";
    const options = {expiresIn: "6m"};

    return jwt.sign(payload, secret, options);
}

async function launchServer() {
    ////////////////////////////////////////////////////////////////////////////////
    // use
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));
    await db.sequelize.sync();
    // await db.sequelize.sync({force: true});
    ////////////////////////////////////////////////////////////////////////////////


    ////////////////////////////////////////////////////////////////////////////////
    // routes
    app.get('/', async (req, res) => {
        res.redirect('/users');
    })
    // 관리자 추가
    // 관리자 삭제
    // 사용자 추가
    app.post('/users', async (req, res) => {
        const currentTimestamp = new Date(Date.now()).toISOString().slice(0, 19).replace('T', ' ');
        const user = await db['user'].create({
            userid: req.body.userid,
            userpass: req.body.userpass,
            token: req.body.userid,
            tel: req.body.userid,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        });
        return res.status(200).json(user);
    })

    //  사용자 삭제
    app.delete('/users/:id', async (req, res) => {
        // 이부분 쿠크나 세션에서 현재 접속된 유저가 관리자 권한일시만 유저 삭제가능,
        // const is_admin = false;
        // const user = await db['user'].findByPk(req.params.id);
        //
        // if (is_admin || !user) {
        //     return res.status(404).json({"error": "user not found or deny to access!"});
        // } else {
        //
        // }
        try {
            await db['user'].destroy({
                where: {
                    id: req.params.id
                }
            });
            return res.status(200).json({"result": true});
        } catch (e) {
            return res.status(403).json({"error": e.message})
        }

    })

    // 관리자가 쿠폰 생성
    app.post('/coupons', async (req, res) => {
        const user_idx = req.body.user_idx;
        //user get
        const user = await db['user'].findByPk(user_idx);
        if (!user) {
            return res.status(404).json({'error': 'user not found'});
        }
        const currentTimestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const exDate = new Date();
        exDate.setMonth(exDate.getMonth() + 6);
        const expirationTimestamp = exDate.toISOString().slice(0, 19).replace('T', ' ');
        const c_name = '10잔 마시면 커피 한잔 무료.';
        coupon = await db['coupon'].create({
            c_name: c_name,
            c_stamp_count: 0,
            user_id: user.id,
            c_exdate: expirationTimestamp,
            c_token: generateJWT(user.user_id),
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        });
        return res.status(200).json(coupon);
    })
    // 관리자가 쿠폰 삭제
    app.delete('/coupons/:id', async (req, res) => {
        try {
            await db['coupon'].destroy({
                where: {
                    id: req.params.id
                }
            });
            return res.status(200).json({"result": true});
        } catch (e) {
            return res.status(403).json({"error": e.message})
        }
    });

    // 관리자가 쿠폰 도장 찍기
    app.put('/stamp/add/:id', async (req, res) => {
        const coupon = await db['coupon'].findByPk(req.params.id);
        if (coupon.is_used || coupon.c_stamp_count == 10) {
            return res.status(201).json({'message': '이미 사용가능/사용한 쿠폰은 도장을 찍으실 필요가 없습니다.'})
        }
        if (coupon.c_stamp_count > 0 || coupon.c_stamp_count < 10) {
            await db['coupon'].increment("c_stamp_count", {by: 1, where: {id: req.params.id}});
            //마지막 도장 찍을때
            if (coupon.c_stamp_count == 10) {
                return res.status(201).json({'message': '10번 도달하였습니다, 쿠폰을 사용하거나 양도 가능합니다.^^'})
            } else {
                return res.status(200).json(await db['coupon'].findByPk(req.params.id));
            }
        } else {
            return res.status(403).json({'error': '상태 이상 관리자에게 문의하세요.'})
        }
    })
    // 관리자가 쿠폰 도장 없애기
    app.put('/stamp/min/:id', async (req, res) => {
        const coupon = await db['coupon'].findByPk(req.params.id);
        if (coupon.is_used) {
            return res.status(201).json({'message': '이미 사용한 쿠폰은 도장을 찍으실 필요가 없습니다.'})
        }
        if (coupon.c_stamp_count > 0 || coupon.c_stamp_count < 10) {
            await db['coupon'].increment("c_stamp_count", {by: -1, where: {id: req.params.id}});
            return res.status(200).json(await db['coupon'].findByPk(req.params.id));
        } else {
            return res.status(403).json({'error': '상태 이상 관리자에게 문의하세요.'})
        }
    })
    // 사용자가 쿠폰을 사용
    app.put('/coupons/use/:id', async (req, res) => {
        await db['coupon'].update(
            {'is_used': 1}, {where: {id: req.params.id}}
        );
        return res.status(200).json({'message': '쿠폰을 사용하였습니다.'});
    })
    // 사용자가 쿠폰을 타인에게 양도
    app.put('/coupons/gift/:id/:userid', async (req, res) => {
        const id = req.params.id;
        const user_id = req.params.userid;
        const user_idx = await db['user'].findOne({where: {'userid': user_id}});
        const coupon = await db['coupon'].findByPk(id);
        if (!user_idx || !coupon) {
            return res.status(404).json({'error': '쿠폰이 없거나, 사용자를 찾을수 없습니다.'});
        }
        await db['coupon'].update(
            {'user_id': user_idx.id}, {where: {'id': coupon.id}}
        );
        return res.status(200).json({"message":`쿠폰코드 ${coupon.id}를 사용자 ${user_id}님께 양도하였습니다.`});
    });

    //사용자 조회
    app.get('/users', async (req, res) => {
        const users = await db['user'].findAll();
        return res.status(200).json(users);
    })

    //개인 사용자 조회.
    app.get('/users/:id', async (req, res) => {
        const user = await db['user'].findByPk(req.params.id);
        return res.status(200).json(user);
    })
    ////////////////////////////////////////////////////////////////////////////////
    app.listen(3000)
}

launchServer();