var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const commanSchema = mongoose.Schema({
    terms_condition : {
        type : String,
        dafault : ""
    },
    privacy_policy : {
        type: String,
        default : ''
    },
    how_working : {
        type : String,
        default : ''
    },
    truck_makes : {
        type : Array,
        default : []
    },
    truck_colors : {
        type : Array,
        default : []
    },
    why_truck_parking : {
        type : String,
        default : ''
    },
    why_truck_parking_data : {
        title : {
            type : String,
            default : ''
        },
        why_data : [
            {
                caption : {
                    type : String,
                    default : ''
                },
                a1_image : {
                    type : String,
                    default : ''
                }
            }
        ]
    },
    about_truck_parking : {
        title : {
            type : String,
            default : ''
        },
        description : {
            type : String,
            default : ''
        }
    },
    owners_saying : {
        type : String,
        default : ''
    },
    video_link : {
        video : {
            type : String,
            default : ''
        },
        youtube : {
            type : String,
            default : ''
        }
    },
    services_and_amenities : [
        {
            icon : {
                type : String,
                default : ''
            },
            content : {
                type : String,
                default : ''
            }
        }
    ]
},
{
    timestamps: true
});

module.exports = mongoose.model('CommonContent', commanSchema, 'common_content');