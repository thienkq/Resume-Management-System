import type { Resume, ResumeEducation, ResumeProfile, ResumeProject, ResumeWorkExperience } from '@/interface/resume';

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface PaginationResumesList {
  resume: Resume[];
  totalCount: number;
}

interface EditResumeResults {
  resume: Resume;
}

interface EditProfile {
  profile: ResumeProfile;
  id: string;
}

interface EditEucation {
  educations: ResumeEducation[];
  id: string;
}

interface EditProjects {
  projects: ResumeProject[];
  id: string;
}

interface EditWorkExperiences {
  workExperiences: ResumeWorkExperience[];
  id: string;
}

interface EditSkills {
  skills: {
    descriptions: string[];
  };
  id: string;
}
//https://cv-management-system.onrender.com/v1
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3000/v1' }),
  tagTypes: ['Resume'],
  endpoints: builder => ({
    getResumesbyPages: builder.query<PaginationResumesList, { keywords: any[]; limit: number; page: number }>({
      query: ({ keywords, limit, page }) => {
        const searchParams = new URLSearchParams();

        searchParams.set('limit', limit.toString());
        searchParams.set('page', page.toString());
        searchParams.set('keywords', keywords.join(',').toString());

        return {
          url: `/resume?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: result => [
        'Resume',
        ...result!.resume.map(({ id }: { id: string }) => ({
          type: 'Resume' as const,
          id,
        })),
      ],
    }),

    getResumes: builder.query<Resume[], void>({
      query: () => '/resume',
      providesTags: (result = []) => [
        'Resume',
        ...result.map(({ id }: { id: string }) => ({
          type: 'Resume' as const,
          id,
        })),
      ],
    }),

    uploadNewResume: builder.mutation({
      query: ({ pdf, jsonData }) => {
        const formData = new FormData();
        console.log(pdf);
        formData.append('pdf', pdf);
        formData.append('jsonData', JSON.stringify(jsonData));

        return {
          url: '/resume',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Resume'],
    }),

    getResumeById: builder.query<Resume, string>({
      query: resumeId => `/resume/${resumeId}`,
      providesTags: (_result, _error, arg) => [{ type: 'Resume', id: arg }],
    }),

    deleteResumeById: builder.mutation<void, string>({
      query: resumeId => ({
        url: `/resume/${resumeId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Resume'],
    }),

    updateProfileById: builder.mutation<EditResumeResults, EditProfile>({
      query: ({ profile, id }) => ({
        url: `/resume/${id}`,
        method: 'PATCH',
        body: { profile },
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: 'Resume', id: arg.id }],
    }),

    updateEducationById: builder.mutation<EditResumeResults, EditEucation>({
      query: ({ educations, id }) => ({
        url: `/resume/${id}`,
        method: 'PATCH',
        body: { educations },
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: 'Resume', id: arg.id }],
    }),

    updateProjectsById: builder.mutation<EditResumeResults, EditProjects>({
      query: ({ projects, id }) => ({
        url: `/resume/${id}`,
        method: 'PATCH',
        body: { projects },
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: 'Resume', id: arg.id }],
    }),

    updateWorkExperiencesById: builder.mutation<EditResumeResults, EditWorkExperiences>({
      query: ({ workExperiences, id }) => ({
        url: `/resume/${id}`,
        method: 'PATCH',
        body: { workExperiences },
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: 'Resume', id: arg.id }],
    }),

    updateSkillsById: builder.mutation<EditResumeResults, EditSkills>({
      query: ({ skills, id }) => ({
        url: `/resume/${id}`,
        method: 'PATCH',
        body: { skills },
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: 'Resume', id: arg.id }],
    }),

    syncGoogleDrive: builder.mutation({
      query: () => {
        return { url: '/resumePDF/auth/google', method: 'GET' };
      },
    }),

    uploadNewResumetoGoogleDrive: builder.mutation({
      query: ({ pdf, jsonData }) => {
        const formData = new FormData();

        formData.append('pdf', pdf);
        formData.append('jsonData', JSON.stringify(jsonData));

        return {
          url: '/resumePDF/upload',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Resume'],
    }),
  }),
});

export const {
  useGetResumesQuery,
  useUploadNewResumeMutation,
  useGetResumeByIdQuery,
  useDeleteResumeByIdMutation,
  useGetResumesbyPagesQuery,
  useUpdateProfileByIdMutation,
  useUpdateEducationByIdMutation,
  useUpdateProjectsByIdMutation,
  useUpdateWorkExperiencesByIdMutation,
  useUpdateSkillsByIdMutation,
  useSyncGoogleDriveMutation,
  useUploadNewResumetoGoogleDriveMutation,
} = apiSlice;
