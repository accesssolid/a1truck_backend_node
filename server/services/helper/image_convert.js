let sharp = require("sharp")
let AWS = require("aws-sdk")

const s3 = new AWS.S3({
    accessKeyId: process.env.AccessKeyId,              // accessKeyId that is stored in .env file
    secretAccessKey: process.env.SecretAccessKey,
    region: process.env.Region   // secretAccessKey is also store in .env file
})

const convertImageToWebp = (data) => {
    return new Promise((resolve, reject) => {
        sharp(data?.buffer).webp({ quality: 50 })
            .toBuffer()
            .then(async (newBuffer) => {
                let upload_ = await uploadToS3(data, newBuffer)
                resolve(upload_);;
            })
            .catch((err) => {
                resolve(false)
            });
    })
}

const uploadToS3 = async (file, bufferImage) => {
    return new Promise((resolve, reject) => {
        let fileName = Date.now().toString() + ".webp"
        let path = "";
        switch (file.fieldname) {
            case "vehicle_pic":
                path = "vehicle_pic/" + fileName;
                break;
            default:
                path = "app_images/" + fileName;
        }
        const params = {
            Bucket: process.env.Bucket,
            ContentType: "image/webp",
            Key: path,
            Body: bufferImage,
        }

        s3.upload(params, async (error, data) => {
            if (error) {
                console.log('bucketerror', error)
                resolve({ status: false, message: "Unable to upload in s3" }) // if we get any error while uploading error message will be returned.
            }
            resolve({ status: true, message: "image_uploaded", data: data })
        })

    })
}
const deleteImage = async (objects) => {
    return new Promise((resolve, reject) => {

        const params = {
            Bucket: process.env.Bucket,
            Delete: {
                Objects: objects
            }
        }

        s3.deleteObjects(params, async (error, data) => {
            if (error) {
                console.log('bucketerror', error)
                resolve({ status: false, message: "Unable to delete in s3" }) // if we get any error while uploading error message will be returned.
            }
            resolve({ status: true, message: "image_delete", data: data })
        })

    })
}
module.exports = {
    convertImageToWebp
};