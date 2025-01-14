// resume.service.js

const httpStatus = require('http-status');
const { Resume } = require('../models');

const ApiError = require('../utils/ApiError');
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
 * @param {cookieString}
 * @param {jobId}
 * @returns {Promise<Object>} - Response from the GrowHire API
 */
const sendResumeToGrowHire = async (resumeId, cookieString, jobId) => {
  const resume = await Resume.findById(resumeId);
  if (!resume) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Resume not found');
  }
  console.log(cookieString, jobId);
  const firstName = resume.profile.name.split(" ")[0]; 
  const lastName = resume.profile.name.split(" ").slice(-1)[0]; 
  
  try {
    // Prepare form data for the API request
    const form = new FormData();
    form.append('firstName', firstName || 'N/A');
    form.append('lastName', lastName || 'N/A');
    form.append('email', resume.profile.email || 'N/A');
    form.append('phoneNumber', resume.profile.phone || 'N/A');
    form.append(
      'socialLinks',
      JSON.stringify([
        {
          type: 'url',
          url: resume.resumePdf?.fileUrl || '',
        },
      ])
    );
    form.append('customFields', JSON.stringify([]));
    form.append('jobId', jobId);

    form.append('resumeFile', undefined);

    console.log(form);
    const response = await fetch(
      'https://dash.growhire.com/api/candidate/create?_data=routes%2Fapi.candidate.create',
      {
        method: 'POST',
        headers: {
          Origin: 'https://dash.growhire.com',
          Referer:
            'https://dash.growhire.com/app/jobs/',
          Cookie: cookieString,
        },
        body: form,
      }
    );
    console.log(`Response Status: ${response.status} - ${response.statusText}`);

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
