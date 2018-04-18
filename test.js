/* eslint-env node, mocha */
const { fromJS, List } = require('immutable');
const assert = require('assert');

/*
Parameters:
  error:
    - an object, array, or a string
  preserved:
    - key names to be preserved or a boolean that determines whether to preserve
    a key's structure

Breakcases:
  - object/array is empty
  - error parameter is a string
*/
function transformErrors(error, ...preserved) {
  if (typeof error === 'string') return `${error}.`;
  if (preserved[0] === false) {
    return error
      .reduce((acc, ele) => acc.concat(transformErrors(ele, false)), List())
      .filter((ele, index, curr) => curr.indexOf(ele) === index);
  }
  return error.map((ele, key) => {
    if ((preserved.includes(key) || preserved[0] === true) && typeof ele.first() !== 'string') {
      return transformErrors(ele, true);
    }
    return transformErrors(ele, false).join(' ');
  });
}


it('should tranform errors', () => {
  // example error object returned from API converted to Immutable.Map
  const errors = fromJS({
    name: ['This field is required'],
    age: ['This field is required', 'Only numeric characters are allowed'],
    urls: [{}, {}, {
      site: {
        code: ['This site code is invalid'],
        id: ['Unsupported id'],
      },
    }],
    url: {
      site: {
        code: ['This site code is invalid'],
        id: ['Unsupported id'],
      },
    },
    tags: [{}, {
      non_field_errors: ['Only alphanumeric characters are allowed'],
      another_error: ['Only alphanumeric characters are allowed'],
      third_error: ['Third error'],
    }, {}, {
      non_field_errors: [
        'Minumum length of 10 characters is required',
        'Only alphanumeric characters are allowed',
      ],
    }],
    tag: {
      nested: {
        non_field_errors: ['Only alphanumeric characters are allowed'],
      },
    },
  });

  // in this specific case,
  // errors for `url` and `urls` keys should be nested
  // see expected object below
  const result = transformErrors(errors, 'url', 'urls');

  assert.deepEqual(result.toJS(), {
    name: 'This field is required.',
    age: 'This field is required. Only numeric characters are allowed.',
    urls: [{}, {}, {
      site: {
        code: 'This site code is invalid.',
        id: 'Unsupported id.',
      },
    }],
    url: {
      site: {
        code: 'This site code is invalid.',
        id: 'Unsupported id.',
      },
    },
    tags: 'Only alphanumeric characters are allowed. Third error. ' +
      'Minumum length of 10 characters is required.',
    tag: 'Only alphanumeric characters are allowed.',
  });
});
