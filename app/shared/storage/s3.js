const {
    S3Client,
    CreateBucketCommand,
    PutObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    CopyObjectCommand,
  } = require("@aws-sdk/client-s3");
  const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
  const { Upload } = require("@aws-sdk/lib-storage");
  
  const ServerError = require("../exceptions/server-error");
  
  module.exports = {
    init,
    createBucket,
    upload,
    download,
    getObject,
    deleteObject,
    asyncUpload,
    getMetadata,
    deleteObjects,
    listObjects,
    copyObject,
    //   emptyBucket,
    generatePreSignedUrl,
  };
  
  let s3Client;
  
  async function init() {
    s3Client = new S3Client({
      region: process.env["AWS_REGION"],
      // endpoint: 'dev.s3.ap-south-1.amazonaws.com',
      credentials: {
        accessKeyId: process.env["AWS_ACCESS_KEY_ID"],
        secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"],
      },
    });
  }
  
  async function createBucket(params) {
    const createBucketParams = {
      Bucket: params["bucketName"],
      ACL: "private",
    };
    try {
      const data = await s3Client.send(
        new CreateBucketCommand(createBucketParams)
      );
      console.log(`Bucket "${bucketName}" created successfully.`);
      return data;
    } catch (err) {
      console.error("Error:", err);
    }
  }
  
  /**
   *
   * @param {*} params
   * @returns
   */
  async function upload(params) {
    let bucketName = params["bucketName"];
    let key = params["key"];
    let data = params["data"];
    let contentType = params["contentType"] || null;
    // configuring parameters
    const paramsObject = {
      Bucket: bucketName,
      Key: key,
      Body: data,
      ACL: params.ACL || "public-read",
      ...(contentType !== null ? { ContentType: contentType } : {}),
    };
    try {
      const command = new PutObjectCommand(paramsObject);
      await s3Client.send(command);
      const url = `https://${bucketName}.s3.amazonaws.com/${key}`;
      return url;
    } catch (ex) {
      console.error("ex", ex);
      throw new ServerError(500, "Error occurred while uploading file to S3");
    }
  }
  
  /**
   *
   * @param {*} params
   * @returns
   */
  async function download(params) {
    const paramsObject = {
      Bucket: params["bucketName"],
      Key: params["key"],
    };
    try {
      const { Body } = await s3Client.send(new GetObjectCommand(paramsObject));
      return Body;
    } catch (ex) {
      throw ex;
    }
  }
  
  /**
   *
   * @param {*} params
   * @returns
   */
  async function asyncUpload(params) {
    let bucketName = params["bucketName"];
    let key = params["key"];
    let data = params["data"];
    let acl = params["acl"];
    let contentType = params["contentType"] || null;
    // configuring parameters
    const paramsObject = {
      Bucket: bucketName,
      Key: key,
      Body: data,
      ...(acl !== null ? { ACL: acl } : {}),
      ...(contentType !== null ? { ContentType: contentType } : {}),
    };
    return new Promise((resolve, reject) => {
      const uploadParallel = new Upload({
        client: s3Client,
        queueSize: 4,
        partSize: 5542880,
        leavePartsOnError: false,
        params: paramsObject,
      });
  
      // Checking progress of upload
      uploadParallel.on("httpUploadProgress", (progress) => {});
  
      // After completion of upload
      uploadParallel
        .done()
        .then((data) => {
          console.log("Upload completed!", { data });
          resolve(data.Key);
        })
        .catch((error) => {
          console.error("Upload failed:", error);
          reject(error);
        });
    });
  }
  
  /**
   * get utf string representation
   * @param {*} bucketName
   * @param {*} key
   * @returns
   */
  async function getObject(bucketName, key) {
    const getObjectParams = {
      Bucket: bucketName,
      Key: key,
    };
    const { Body } = await s3Client.send(new GetObjectCommand(getObjectParams));
    return Body.toString("utf-8");
  }
  
  async function getMetadata(params) {
    const metaData = await s3Client.send(new HeadObjectCommand(params));
    return metaData;
  }
  
  /**
   *
   * @param {*} params
   * @returns
   */
  async function deleteObject(params) {
    const paramsObject = {
      Bucket: params["bucketName"],
      Key: params["key"],
    };
    const command = new DeleteObjectCommand(paramsObject);
    const data = await s3Client.send(command);
    return data;
  }
  
  /**
   *
   * @param {*} bucket  bucket name
   * @param {*} objects  list of key names to be deleted
   * @returns
   */
  async function deleteObjects(bucket, objects) {
    const params = {
      Bucket: bucket,
      Delete: {
        Objects: objects.map((key) => ({ Key: key })),
      },
    };
    const data = await s3Client.send(new DeleteObjectsCommand(params));
    return data;
  }
  
  /**
   *
   * @param {*} bucketName
   * @param {*} src
   * @param {*} dest
   * @returns
   */
  async function copyObject(bucketName, src, dest) {
    const paramsObject = {
      Bucket: bucketName,
      CopySource: src,
      Key: dest,
      ACL: "public-read",
    };
    const command = new CopyObjectCommand(paramsObject);
    const data = await s3Client.send(command);
    return data;
  }
  
  /**
   *
   * @param {*} bucket
   * @param {*} prefix
   * @param {*} maxKeys
   * @param {*} continuationToken
   * @returns
   */
  async function listObjects(
    bucket,
    prefix = null,
    maxKeys = null,
    continuationToken = null
  ) {
    const params = {
      Bucket: bucket,
      ...(prefix !== null ? { Prefix: prefix } : {}),
      ...(continuationToken !== null
        ? { ContinuationToken: continuationToken }
        : {}),
      ...(maxKeys !== null ? { MaxKeys: maxKeys } : {}),
    };
  
    const response = await s3Client.send(new ListObjectsV2Command(params));
    console.log(`Objects in bucket "${bucket}":`);
    response.Contents.forEach((object) => {
      console.log(`- ${object.Key} (Size: ${object.Size} bytes)`);
    });
    return response;
  }
  
  // /**
  //  * empty bucket for an instance
  //  * @param {*} bucketName
  //  * @param {*} prefix
  //  */
  // async function emptyBucket(bucketName, prefix = null) {
  //   let nextToken;
  //   let objectsToDelete = [];
  //   do {
  //     let objectKeys = await listObjects(bucketName, prefix, 1000, nextToken);
  //     objectKeys.Contents.forEach((object) => {
  //       objectsToDelete.push({ Key: object.Key });
  //     });
  
  //     // delete objects if any
  //     if (objectKeys.KeyCount > 0) {
  //       await deleteObjects(bucketName, objectsToDelete);
  //     }
  
  //     nextToken = objectKeys.NextContinuationToken;
  //     objectsToDelete = [];
  //   } while (nextToken);
  // }
  
  async function generatePreSignedUrl(bucketName, objectKey, expiresIn) {
    //console.log("signedurl", bucketName, objectKey);
  
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
  
    const url = await getSignedUrl(s3Client, command, {
      ...(expiresIn ? { expiresIn: expiresIn } : {}),
    });
    return url;
  }
  