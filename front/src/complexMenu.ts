export default [
  {
    path: '/home',
    name: '首页',
    locale: 'menu.home',
    routes: [
      {
        path: '/home/overview',
        name: '注册界面',
        hideInMenu: false,
        locale: 'menu.home.overview',
      },
    ],
  },
  {
    path: '/proposal',
    name: '提案界面',
    locale: 'menu.proposal',
    routes: [
      {
        path: '/proposal/publish',
        name: '发布界面',
        hideInMenu: false,
        locale: 'menu.proposal.publish',
      },
      {
        path: '/proposal/vote',
        name: '投票界面',
        hideInMenu: false,
        locale: 'menu.proposal.vote',
      },
    ],
  },
  {
    path: '/bonus',
    name: '个人界面',
    locale: 'menu.bonus',
    routes: [
      {
        path: '/bonus/imformation',
        name: '个人信息',
        hideInMenu: false,
        locale: 'menu.bonus.imformation',
      },
    ],
  },
];