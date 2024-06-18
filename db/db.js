const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false,
});

const User = sequelize.define('User', {
    userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    mail: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    credits: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    titles: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '[]'
    }
});

const Generation = sequelize.define('Generation', {
    idPost: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,

    }
});


User.hasMany(Generation, { foreignKey: 'userId' });
Generation.belongsTo(User, { foreignKey: 'userId' });


sequelize.sync();

module.exports = {
    sequelize,
    User,
    Generation
};
