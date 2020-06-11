// @login & register
const express = require('express');
const router = express.Router();
const passport = require('passport');

const Profile = require('../../models/Profile');

// @route  GET api/profiles/test
// @desc   返回的请求的json数据
// @access public
router.get('/test', (req, res) => {
  res.json({ msg: 'profile works' });
});

// @route  POST api/profiles/add
// @desc   添加课程信息接口
// @access Private
router.post(
  '/add',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const profileFields = {};

    if (req.body.type) profileFields.type = req.body.type;
    if (req.body.title) profileFields.title = req.body.title;
    if (req.body.level) profileFields.level = req.body.level;
    if (req.body.count) profileFields.count = req.body.count;
    if (req.body.date) profileFields.date = req.body.date;

    new Profile(profileFields).save().then(profile => {
      res.json({
        state: 'suc',
        msg: '添加成功',
        datas: profile
      });
    });
  }
);

// @route  GET api/profiles/all
// @desc   获取所有课程信息
// @access Private

router.get(
  '/all',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.find()
      .then(profile => {
        if (!profile) {
          return res.status(404).json('没有任何课程信息');
        }

        res.json({
          state: 'suc',
          msg: '成功获取所有课程信息',
          data: {
            total: profile.length,
            list: profile
          }
        });
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route  POST api/profiles/edit/:id
// @desc   编辑课程信息接口
// @access Private
router.post(
  '/edit/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const profileFields = {};

    if (req.body.type) profileFields.type = req.body.type;
    if (req.body.title) profileFields.title = req.body.title;
    if (req.body.level) profileFields.level = req.body.level;
    if (req.body.count) profileFields.count = req.body.count;
    if (req.body.date) profileFields.date = req.body.date;

    Profile.findOneAndUpdate(
      { _id: req.params.id },
      { $set: profileFields },
      { new: true }
    ).then(profile =>
      res.json({
        state: 'suc',
        msg: '编辑成功'
      })
    );
  }
);

// @route  POST api/profiles/delete/:id
// @desc   删除信息接口
// @access Private
router.delete(
  '/delete/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOneAndRemove({ _id: req.params.id })
      .then(profile => {
        profile.save().then(profile =>
          res.json({
            state: 'suc',
            msg: '删除成功'
          })
        );
      })
      .catch(err => res.status(404).json('删除失败!'));
  }
);

// $route  GET api/profiles/loadMore/:page/:size
// @desc   分页的接口
// @access private
router.get(
  '/loadMore/:page/:size',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.find()
      .sort({ date: -1 })
      .then(profiles => {
        if (!profiles) {
          res.status(404).json('没有任何课程信息');
        } else {
          let size = req.params.size;
          let page = req.params.page;
          let index = size * (page - 1);
          let newProfiles = [];
          for (let i = index; i < size * page; i++) {
            if (profiles[i] != null) {
              newProfiles.unshift(profiles[i]);
            }
          }
          res.json({
            state: 'suc',
            msg: `成果获取${newProfiles.length}条课程信息`,
            data: {
              total: profiles.length,
              list: newProfiles
            }
          });
        }
      })
      .catch(err => res.status(404).json(err));
  }
);

// $route  GET api/profiles/search/:kw
// @desc   关键字查询的接口
// @access private
router.get(
  '/search/:kw/:page/:pageSize',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    let kw = req.params.kw;
    let datas = [];

    Profile.find()
      .then(profiles => {
        if (!profiles) {
          return res.status(404).json('没有任何课程信息');
        }

        profiles.forEach(profile => {
          if (profile.title.indexOf(kw) != -1) datas.push(profile);
        });

        let pageSize = req.params.pageSize;
        let page = req.params.page;
        let index = pageSize * (page - 1);
        let newDatas = [];
        for (let i = index; i < pageSize * page; i++) {
          if (datas[i] != null) {
            newDatas.unshift(datas[i]);
          }
        }

        res.status(200).json({
          state: 'suc',
          msg: '成功加载更多周报数据',
          datas: {
            total: datas.length,
            list: newDatas
          }
        });
      })
      .catch(err => res.status(404).json(err));
  }
);

module.exports = router;
