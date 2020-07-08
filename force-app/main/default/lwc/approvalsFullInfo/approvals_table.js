const actions = [
    {
        label: 'Show details',
        name: 'show_details'
    },
    {
        label: 'Approve',
        name: 'approve'
    },
    {
        label: 'Reject',
        name: 'reject'
    },
    {
        label: 'Reassign',
        name: 'reassign'
    },
];
const columns = [
    {
        label: 'View Details',
        type:  'button',
        fieldName: 'details',
        initialWidth: 100,
        typeAttributes:
            {
                label: 'Detail',
                title: 'Detail',
                name: 'viewDetails',
                value: 'idObject',
                variant: 'base',
                disabled: false,
            }
    },
    {
        label: 'Approval Process Name',
        fieldName: 'idObject',
        type: 'url',
        typeAttributes:{
            label: {
                fieldName: 'processName'
            },
            target: '_blank',
        },
        sortable: true,
    },
    {
        label: 'Descriptions process',
        fieldName: 'desc',
        type: 'text',
        sortable: true,
    },
    {
        label: 'Approver',
        fieldName: 'actorName',
        type: 'text',
        sortable: true,
    },
    {
        label: 'Status process',
        fieldName: 'statusProc',
        type: 'text',
        sortable: true,
    },
];

export {columns};
export {actions};