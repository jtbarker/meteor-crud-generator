collection = new Meteor.Collection(null),
schema = {
    'id' : 'number:4',
    'name' : 'string:64',
    'created' : 'date:-1',
    'notRequired' : '_string:10'
},
options = {},
crud = new Meteor.CRUDGenerator(collection, schema, options);

// @see https://www.eventedmind.com/posts/meteor-testing-packages-with-tinytest
Tinytest.add('CrudGenerator - Constructor', function (test) {
    test.throws(function () {
            new Meteor.CRUDGenerator(null, null)
        }, Error, 'Should throw an error if Schema and Definition aren\'t provided'
    );

    test.instanceOf(crud, Meteor.CRUDGenerator, 'Should be instance of itself');
    test.equal(crud.schema, schema, 'Should have a property schema');
    test.equal(crud.options, options, 'Should have a property options');
});

Tinytest.add('CrudGenerator - Test changeValueType', function (test) {
    test.equal(crud.changeValueType('bla', 'string'), 'bla', 'Should stay a string');
    test.equal(crud.changeValueType('12.', 'number'), 12, 'Should convert to a Number');
    test.equal(crud.changeValueType('1.12.2012', 'date'), new Date('1.12.2012'), 'Should convert to a javascript Date Object');
});

Tinytest.add('CrudGenerator - Test getRequiredFields', function (test) {
    var secondSchema = {
        'id' : '_number:4',
        'name' : '_string:2'
    };
    test.equal(crud.getRequiredFields(schema), {
        'id' : 'number:4',
        'name' : 'string:64',
        'created' : 'date:-1'
    });

    test.equal(crud.getRequiredFields(secondSchema), {});
    test.equal(crud.getRequiredFields({}), {});
});

Tinytest.add('CrudGenerator - Test isDefinitionRequired', function (test) {
    test.equal(crud.isDefinitionRequired('_number'), false);
    test.equal(crud.isDefinitionRequired('string'), true);
});

Tinytest.add('CrudGenerator - Test validCRUDObject', function (test) {
    var createdAt = new Date();


    test.isTrue(
        crud.validCRUDObject(
            {
                'id' : 2,
                'name' : 'A valid name, less than 64 characters (as defined in the schema)',
                'notRequired' : 'asdfga',
                'created' : createdAt
            },
            schema
        ), 'Shouldn\'t have any problems validating the provided object'
    );

    // Since the notRequired isn't required
    test.isTrue(
        crud.validCRUDObject(
            {
                'id' : 2,
                'name' : 'A valid name, less than 64 characters (as defined in the schema)',
                'created' : createdAt
            },
            schema
        ), 'Shouldn\'t have any problems validating the provided object, since the field "notRequired isnt required'
    );

    test.throws(function () {
            var response = crud.validCRUDObject({
                'id' : '2',
                'name' : 'A valid name',
                'created' : createdAt
            }, schema);
        }, Meteor.Error, 'Should throw an error because the id isn\'t a number'
    );

    test.throws(function () {
            var response = crud.validCRUDObject({
                'id' : '2'
            }, schema);
        }, Meteor.Error, 'Should throw an error because the object doesn\'t contain all values'
    );

    test.throws(function () {
            var response = crud.validCRUDObject({
                'id' : 2,
                'name' : 10,
                'created' : createdAt
            }, schema);
        }, Meteor.Error, 'Should throw an error because the name isn\'t a string'
    );

    test.throws(function () {
            var response = crud.validCRUDObject({
                'id' : 2,
                'name' : 'A valid name',
                'created' : true
            }, schema);
        }, Meteor.Error, 'Should throw an error because the created isn\'t a date'
    );

    test.throws(function () {
            var response = crud.validCRUDObject(10, schema);
        }, Meteor.Error, 'Should throw an Error because of invalid parameters'
    );
});

Tinytest.add('CrudGenerator - Test recognizeFieldDefinition', function (test) {
    test.equal(
        crud.recognizeFieldDefinition('string'),
        { contentType: 'string' },
        'Should return a valid field definition object, with unlimited length'
    );

    test.equal(
        crud.recognizeFieldDefinition('string:4'),
        { contentType: 'string', 'defLength' : 4 },
        'Should return a valid field definition object'
    );

    test.equal(
        crud.recognizeFieldDefinition('number:400:email'),
        { contentType: 'number', 'defLength' : 400, specialProp : 'email' },
        'Should return a valid field definition object, with a special prop'
    );

    test.throws(function () {
        var obj = crud.recognizeFieldDefinition('');
    }, Meteor.Error, 'Should throw an Error if string is empty');
});

Tinytest.add('CrudGenerator - Test valueIsValid', function (test) {
    test.isTrue(
        crud.valueIsValid('string', 'Me is a normal string'),
        'Should validate with true, since it\'s a string'
    );

    test.isTrue(
        crud.valueIsValid('number:3', 100),
        'Should validate with true, since it\s a number'
    );

    test.isTrue(
        crud.valueIsValid('object:2', { 'bla' : 'blo', 'blar' : 'blor' }),
        'Should return a valid field definition object, with a special prop'
    );

    test.throws(function () {
            var bool = crud.valueIsValid('object:1', { 'bla' : 'blo', 'blar' : 'blor' });
        }, Meteor.Error, 'Should throw an Error because the object provided is too long');

    test.throws(function () {
            var bool = crud.valueIsValid('number:3', { 'bla' : 'blo', 'blar' : 'blor' });
        }, Meteor.Error, 'Should throw an Error because the value is an object and not a number');

    test.throws(function () {
            var obj = crud.valueIsValid('', '');
        }, Meteor.Error, 'Should throw an Error if parameters are invalid');
})