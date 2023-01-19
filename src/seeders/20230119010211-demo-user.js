'use strict';
const {faker} = require('@faker-js/faker');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {

        const currentTimestamp = new Date(Date.now()).toISOString().slice(0, 19).replace('T', ' ');

        await queryInterface.bulkInsert('users', [{
            userid: faker.internet.userName(),
            userpass: faker.internet.password(),
            token: faker.name.middleName(),
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp
        }], {});
    },

    async down(queryInterface, Sequelize) {

        await queryInterface.bulkDelete('users', null, {});
    }
};
