// c:/Users/andre/Desktop/api-banco-ferremax/src/migrations/YYYYMMDDHHMMSS-add-active-column-to-divisas.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('Divisas', 'Activa', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }, { transaction });
      await transaction.commit();
      console.log('Columna "Activa" añadida a la tabla "Divisas".');
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('Divisas', 'Activa', { transaction });
      await transaction.commit();
      console.log('Columna "Activa" eliminada de la tabla "Divisas".');
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
