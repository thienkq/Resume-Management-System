// resume.service.js

const httpStatus = require('http-status');
const { Resume } = require('../models');
const { Readable } = require('stream');
const ApiError = require('../utils/ApiError');
const http = require('node:https');
const uploadToCloudinary = require('../utils/cloudinary-upload');
const DeleteOnCloudinary = require('../utils/cloudinary-delete');

/**
 * Create or update a resume
 * @param {ObjectId} resumeBody
 * @returns {Promise<Resume>}
 */
const createResume = async (req) => {
  const file = req.file;
  const parsedJSON = JSON.parse(req.body.jsonData);
  try {
    const result = await uploadToCloudinary(file.buffer);

    const fileUrl = result.secure_url;
    const cloudinaryId = result.public_id;

    const resumePdf = { fileUrl, cloudinaryId };

    const newResume = await Resume.create({ ...parsedJSON, resumePdf });

    console.log(newResume);
    return newResume;
  } catch (error) {
    console.error('Error uploading file to server:', error);
  }
};

/**
 * Update a resume by ID
 * @param {ObjectId} resumeId - The ID of the resume to update
 * @param {Object} updateData - The data to update the resume with
 * @returns {Promise<Resume>} - The updated resume
 */
const updateResumeById = async (resumeId, updateData) => {
  const resume = await Resume.findById(resumeId);
  if (!resume) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Can not update resume because of invalid id');
  }
  const updatedResume = await Resume.findByIdAndUpdate(resumeId, updateData, { new: true });
  return updatedResume;
};

/**
 * Delete a resume by ID
 * @param {ObjectId} resumeId
 * @returns {Promise<Resume>}
 */
const deleteResumeById = async (resumeId) => {
  const result = await Resume.findById(resumeId);
  const cloudinaryId = result.resumePdf.cloudinaryId;
  console.log(cloudinaryId);
  console.log(cloudinaryId);
  const resume = await Resume.findByIdAndDelete(resumeId);
  if (!resume) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Can not delete resume because of invalid id');
  }
  await DeleteOnCloudinary(cloudinaryId);
  return resume;
};

/**
 * Get all resume
 * @returns {Promise<Resume>}
 */
const getResumeAll = async () => {
  const resume = await Resume.find();
  return resume;
};

/**
 * Get a resume by ID
 * @param {ObjectId} resumeId
 * @returns {Promise<Resume>}
 */
const getResumeById = async (resumeId) => {
  const resume = await Resume.findById(resumeId);
  if (!resume) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Can not get resume because of invalid id');
  }
  return resume;
};

/**
 * Get resume by page
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<Resume>}
 */
// const getResumeListbyPage = async (options) => {
//   page = Number.parseInt(options.page);
//   limit = Number.parseInt(options.limit);
//   const totalCount = await Resume.countDocuments({});
//   const totalPages = Math.ceil(totalCount / limit);
//   const skip = (page - 1) * limit;

//   const resume = await Resume.find({}).skip(skip).limit(limit).exec();
//   return {
//     resume,
//     currentPage: page,
//     totalPages,
//     totalCount,
//   };
// };

const getResumes = async (options, keywords) => {
  const page = options.page;
  const limit = options.limit;

  let resume;
  let totalCount;

  if (keywords.length === 0) {
    resume = await Resume.find({}, null, options);
    totalCount = await Resume.countDocuments({});
  } else {
    resume = await Resume.find(
      {
        $text: { $search: keywords.join(' ') },
      },
      null,
      options
    );
    totalCount = await Resume.countDocuments({
      $text: { $search: keywords.join(' ') },
    });
  }


  return {
    resume,
    currentPage: parseInt(page, 10),
    totalPages: Math.ceil(totalCount / limit),
    totalCount
  };
};

/**
 * Send a resume to the GrowHire API
 * @param {ObjectId} resumeId - The ID of the resume to send
 * @returns {Promise<Object>} - Response from the GrowHire API
 */
const sendResumeToGrowHire = async (resumeId) => {
  const resume = await Resume.findById(resumeId);
  if (!resume) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Resume not found');
  }

  try {
    // Prepare form data for the API request
    const form = new FormData();
    form.append('firstName', resume.profile.firstName || 'N/A');
    form.append('lastName', resume.profile.lastName || 'N/A');
    form.append('email', resume.profile.email || 'N/A');
    form.append('phoneNumber', resume.profile.phone || 'N/A');
    form.append(
      'socialLinks',
      JSON.stringify([
        {
          type: '',
          url: '',
        },
      ])
    );    
    form.append('customFields', JSON.stringify([]));
    form.append('jobId', resume.profile.jobId || 'cm5kjxmdk018hr6ztqwbumdf6');
    const fileResponse = await fetch(resume.resumePdf.fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file from URL: ${fileResponse.statusText}`);
    }

    // Convert the response into a Buffer
    const arrayBuffer = await fileResponse.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Append the file to FormData using a readable stream
    const fileStream = Readable.from(fileBuffer);
    form.append('resumeFile', fileStream, { filename: 'resume.pdf', contentType: 'application/pdf' });

    


    const response = await fetch(
      'https://dash.growhire.com/api/candidate/create?_data=routes%2Fapi.candidate.create',
      {
        method: 'POST',
        headers: {
          Origin: 'https://dash.growhire.com',
          Referer:
            'https://dash.growhire.com/app/jobs/cm5kjxmdk018hr6ztqwbumdf6/cm5kjxmdn018jr6zteh1aeu86/cm5kkct8r01a4r6zt26a1uezd',
          Cookie: 'cookieyes-consent=consentid:dWFpcGZ3NWdxa3U3SGNoT3pPbU92Nk8zUlFNZE9FSmI,consent:yes,action:yes,necessary:yes,functional:yes,analytics:yes,performance:yes,advertisement:yes,other:yes,lastRenewedDate:1728636632000; _session=eyJ1c2VyIjp7Im9rIjp0cnVlLCJ1c2VyIjp7ImlkIjoiY201a2p3OXlzMDFyYzIyMGp2MTJ2emI4ZSIsImVtYWlsIjoicnVieUBjb2RlcnB1c2guY29tIiwic3RhdHVzIjoibm90LWNvbmZpcm1lZCIsImZpcnN0TmFtZSI6InJ1YnkiLCJsYXN0TmFtZSI6IiIsInBob3RvVXJsIjpudWxsLCJleGV0cm5hbFBob3RvSWQiOm51bGwsImNyZWF0ZWRBdCI6IjIwMjUtMDEtMDZUMDQ6Mzc6NDMuOTI0WiIsInVwZGF0ZWRBdCI6IjIwMjUtMDEtMDZUMDQ6Mzc6NDMuOTI0WiIsImxhc3RBY3RpdmVBdCI6bnVsbCwiZmFpbGVkTG9naW5BdHRlbXB0cyI6MCwibGFzdEZhaWxlZExvZ2ludEF0dGVtcHQiOm51bGwsIm9uYm9hcmRpbmdEZW1vU3RhdHVzIjpudWxsfSwiYWNjZXNzVG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKcGNDSTZJakV3TGpJd055NHlOVEF1TVRreklpd2lhV0YwSWpveE56TTJNVE00TWpjNUxDSmxlSEFpT2pFM016Y3pORGM0Tnprc0ltRjFaQ0k2SW1OdE5XdHFkemw1Y3pBeGNtTXlNakJxZGpFeWRucGlPR1VpTENKcGMzTWlPaUpuY205M2FHbHlaUzVqYjIwaWZRLmZ3amMzZUh0YjJ3SGoxUGpKVm1jcmFCVGVwUENHaEphYkhpTTRGT2hpX1Yzb1ZzMHBuN2paZ09rQzJReERuOU9BaFV0ci1XcG05VHBSQW9fV3NPaVl5UXlkVVhONXc3WVlUWnRnYWRWWkJVVmpTZlF2bnJXeGg5YmczeTZjNUtfUFhtb2pkREp2NlIxMXFCb1JtUGE3bldLVXU5MWcxSGpaMklhU3dVaVZHUkVhTTZiZ1IyeExxTnhUMmduWGlSRWl5aU9ybDl5cFJ6QnBNOHM3ZXNxSTFSWFlqUXVkejBjNHFGYWJzcmVJZURjQy1SUWtpbm56UWs4cTBhLTVUZEJ3dUJpbS0tejFlbS12QUtvX2lrSnVvV2Fwc0JKbEFJYXFFNkRoaFlxWEZLbGpJc2F2UzVmRXFXUHU0Um1FZVhabXVlUlZLRjc3VnRJekJ2MmNuLThQODE5aVo1bHZvT0FhTEMzV09zWGRsZHJhamJkZE5LY3VNbVRYeUpoTmV3STg0X3E5QTNZWjZnM0RUWXZGdkxHMDFWT1pmbjhMdlF6QlFXNnVPaW5hZzlNMmd2UV9HeGdZMXhTZFdscV9HdmpyTXpTdDhHTldaRnBvWUhUdXlKRWx1dGQ2NEhyejRHbDdMVHJPbTFzS293aEM1Z0p1ZHl1Nl82N0JkanRSeGRTdmlkX1R0b2tUSUNDVDVGZU5Cd0F5RzcyU0dPam5tUXBwY2Q0VkVTbjA5dVhkLUhKNGRveFFvSnY5MlVicDUwcEo2WUg3dDVDSDlHSGZJY0YyWDQyX3lQeXE2cm9yWEFYamhQcndwQ2MtLV9oYm1ZVGtyamgtaXNTdlYtT0dpTm9SZjFRV2pwRE9SUE9Kall3eFYxS3U3Ml92am90cHF4SzJBVndZMkhWQXJrIn0sInN0cmF0ZWd5IjoiYXBpIn0%3D.SxufsE5UIjA18UFlcZDQxCqM1UeDE9tPCv7dOThc9KY; _gcl_au=1.1.1494908659.1736138280; intercom-device-id-fmi28bcl=b8582996-c6e2-448e-9710-87d68c321404; _BEAMER_USER_ID_HAKufgpY60879=39b312be-f208-4f76-a0af-7ce5f77185e7; _BEAMER_FIRST_VISIT_HAKufgpY60879=2025-01-06T04:39:44.796Z; _BEAMER_FILTER_BY_URL_HAKufgpY60879=false; _BEAMER_FILTER_BY_URL_HAKufgpY60879=false; intercom-session-fmi28bcl=NzJxN1pnRXVsNFB1dE84S3Z0S29ZOU05ZW85NHIyTitGeVgyQ0hKeHBId2p6aGJkcStLcjBhZU1vdE05R3BSdC0teTMxMXhOUytWeVJEbGkrMDdzekdqZz09--bfec2e50b4bf36b6d44ca1084df6e5a3304a5227; ph_phc_vKhxLEvEjLw0vBg7atb5yoatB7MbRAenBbO3fR8foYL_posthog=%7B%22distinct_id%22%3A%22cm5kjw9ys01rc220jv12vzb8e%22%2C%22%24sesid%22%3A%5B1736223026996%2C%2201943ef3-7e13-7fb6-bf38-3e08e6affad4%22%2C1736222932498%5D%2C%22%24epp%22%3Atrue%7D'
        },
        body: form,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to send resume: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Resume sent successfully:', result);

    return result;
  } catch (error) {
    console.error('Error sending resume to GrowHire:', error);
    throw error;
  }
};

module.exports = {
  createResume,
  getResumeById,
  deleteResumeById,
  getResumeAll,
  updateResumeById,
  getResumes,
  sendResumeToGrowHire
};
