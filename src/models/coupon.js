'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class coupon extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  coupon.init({
    c_name: DataTypes.STRING,
    c_stamp_count: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    c_exdate: DataTypes.DATE,
    c_token: DataTypes.STRING,
    is_used: {
      allowNull: false,
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'coupon',
  });
  return coupon;
};