import { getType } from '../lib/get_type';

export const mapColumn = () => ({
  name: 'mapColumn',
  aliases: ['mc'], // midnight commander. So many times I've launched midnight commander instead of moving a file.
  type: 'datatable',
  help: 'Add a column calculated as the result of other columns, or not',
  context: {
    types: ['datatable'],
  },
  args: {
    _: {
      types: ['string'],
      aliases: ['column'],
      help: 'The name of the resulting column',
    },
    expression: {
      types: ['function'],
      aliases: ['exp', 'fn'],
      help:
        'A canvas expression which will be passed each row as a single row datatable unless you set context=false',
    },
    context: {
      types: ['boolean'],
      default: 'true',
      help: 'Should I pass context into `expression`?',
    },
  },
  fn: (context, args) => {
    const rowPromises = context.rows.map(row => {
      return args
        .expression(
          !args.context
            ? null
            : {
                type: 'datatable',
                columns: context.columns,
                rows: [row],
              }
        )
        .then(val => {
          if (typeof val === 'object' && val !== null) {
            throw new Error('Expression must return a literal, eg a string, number, boolean, null');
          }

          return {
            ...row,
            [args._]: val,
          };
        });
    });

    return Promise.all(rowPromises).then(rows => {
      if (!context.columns.find(column => column.name === args._)) {
        context.columns.push({ name: args._, type: getType(rows[0][args._]) });
      }

      return {
        type: 'datatable',
        columns: context.columns,
        rows,
      };
    });
  },
});
