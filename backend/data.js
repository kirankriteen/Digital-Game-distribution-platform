const ROLE = {
  ADMIN: 'admin',
  BASIC: 'basic'
}

module.exports = {
  ROLE: ROLE,
  users: [
    { id: 1, name: 'Kyle', role: ROLE.ADMIN },
    { id: 2, name: 'Sally', role: ROLE.BASIC },
    { id: 3, name: 'Joe', role: ROLE.BASIC }
  ],
  projects: [
    { id: 1, name: "Kyle's Project", userId: 1 },
    { id: 2, name: "Sally's Project", userId: 2 },
    { id: 3, name: "Joe's Project", userId: 3 }
  ], userData: [
    { id: 1, username: 'kyle', password: '$2b$10$LdHHjTUSJ3jN4/22wBRHOOQres.LtoHp.2SKozwiQImdincM6WMsO'},
    { id: 2, username: 'sally', password: '$2b$10$rmqcYxJZjIjBdLaZIwJTmuDAlJOQo5RlEdT0euydIIgdZzvy5b206'},
    { id: 3, username: 'joe', password: '$2b$10$U8ci19pZYqP2vG3n9R62Teoux8dCNmwantXzpVpTf7i.ZG1y6QCfa'},
  ]
}