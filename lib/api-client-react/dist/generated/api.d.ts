import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { Channel, CreateChannelRequest, CreateNicheRequest, CreateVideoRequest, DailyEarning, EarningsOverview, HealthStatus, ListVideosParams, Niche, ScheduleEntry, UpdateVideoRequest, Video } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List all channels
 */
export declare const getListChannelsUrl: () => string;
export declare const listChannels: (options?: RequestInit) => Promise<Channel[]>;
export declare const getListChannelsQueryKey: () => readonly ["/api/channels"];
export declare const getListChannelsQueryOptions: <TData = Awaited<ReturnType<typeof listChannels>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listChannels>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listChannels>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListChannelsQueryResult = NonNullable<Awaited<ReturnType<typeof listChannels>>>;
export type ListChannelsQueryError = ErrorType<unknown>;
/**
 * @summary List all channels
 */
export declare function useListChannels<TData = Awaited<ReturnType<typeof listChannels>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listChannels>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new channel
 */
export declare const getCreateChannelUrl: () => string;
export declare const createChannel: (createChannelRequest: CreateChannelRequest, options?: RequestInit) => Promise<Channel>;
export declare const getCreateChannelMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createChannel>>, TError, {
        data: BodyType<CreateChannelRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createChannel>>, TError, {
    data: BodyType<CreateChannelRequest>;
}, TContext>;
export type CreateChannelMutationResult = NonNullable<Awaited<ReturnType<typeof createChannel>>>;
export type CreateChannelMutationBody = BodyType<CreateChannelRequest>;
export type CreateChannelMutationError = ErrorType<unknown>;
/**
 * @summary Create a new channel
 */
export declare const useCreateChannel: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createChannel>>, TError, {
        data: BodyType<CreateChannelRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createChannel>>, TError, {
    data: BodyType<CreateChannelRequest>;
}, TContext>;
/**
 * @summary Get a channel
 */
export declare const getGetChannelUrl: (id: number) => string;
export declare const getChannel: (id: number, options?: RequestInit) => Promise<Channel>;
export declare const getGetChannelQueryKey: (id: number) => readonly [`/api/channels/${number}`];
export declare const getGetChannelQueryOptions: <TData = Awaited<ReturnType<typeof getChannel>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getChannel>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getChannel>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetChannelQueryResult = NonNullable<Awaited<ReturnType<typeof getChannel>>>;
export type GetChannelQueryError = ErrorType<unknown>;
/**
 * @summary Get a channel
 */
export declare function useGetChannel<TData = Awaited<ReturnType<typeof getChannel>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getChannel>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List all videos
 */
export declare const getListVideosUrl: (params?: ListVideosParams) => string;
export declare const listVideos: (params?: ListVideosParams, options?: RequestInit) => Promise<Video[]>;
export declare const getListVideosQueryKey: (params?: ListVideosParams) => readonly ["/api/videos", ...ListVideosParams[]];
export declare const getListVideosQueryOptions: <TData = Awaited<ReturnType<typeof listVideos>>, TError = ErrorType<unknown>>(params?: ListVideosParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listVideos>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listVideos>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListVideosQueryResult = NonNullable<Awaited<ReturnType<typeof listVideos>>>;
export type ListVideosQueryError = ErrorType<unknown>;
/**
 * @summary List all videos
 */
export declare function useListVideos<TData = Awaited<ReturnType<typeof listVideos>>, TError = ErrorType<unknown>>(params?: ListVideosParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listVideos>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new video entry
 */
export declare const getCreateVideoUrl: () => string;
export declare const createVideo: (createVideoRequest: CreateVideoRequest, options?: RequestInit) => Promise<Video>;
export declare const getCreateVideoMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createVideo>>, TError, {
        data: BodyType<CreateVideoRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createVideo>>, TError, {
    data: BodyType<CreateVideoRequest>;
}, TContext>;
export type CreateVideoMutationResult = NonNullable<Awaited<ReturnType<typeof createVideo>>>;
export type CreateVideoMutationBody = BodyType<CreateVideoRequest>;
export type CreateVideoMutationError = ErrorType<unknown>;
/**
 * @summary Create a new video entry
 */
export declare const useCreateVideo: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createVideo>>, TError, {
        data: BodyType<CreateVideoRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createVideo>>, TError, {
    data: BodyType<CreateVideoRequest>;
}, TContext>;
/**
 * @summary Get a video
 */
export declare const getGetVideoUrl: (id: number) => string;
export declare const getVideo: (id: number, options?: RequestInit) => Promise<Video>;
export declare const getGetVideoQueryKey: (id: number) => readonly [`/api/videos/${number}`];
export declare const getGetVideoQueryOptions: <TData = Awaited<ReturnType<typeof getVideo>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getVideo>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getVideo>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetVideoQueryResult = NonNullable<Awaited<ReturnType<typeof getVideo>>>;
export type GetVideoQueryError = ErrorType<unknown>;
/**
 * @summary Get a video
 */
export declare function useGetVideo<TData = Awaited<ReturnType<typeof getVideo>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getVideo>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update a video
 */
export declare const getUpdateVideoUrl: (id: number) => string;
export declare const updateVideo: (id: number, updateVideoRequest: UpdateVideoRequest, options?: RequestInit) => Promise<Video>;
export declare const getUpdateVideoMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateVideo>>, TError, {
        id: number;
        data: BodyType<UpdateVideoRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateVideo>>, TError, {
    id: number;
    data: BodyType<UpdateVideoRequest>;
}, TContext>;
export type UpdateVideoMutationResult = NonNullable<Awaited<ReturnType<typeof updateVideo>>>;
export type UpdateVideoMutationBody = BodyType<UpdateVideoRequest>;
export type UpdateVideoMutationError = ErrorType<unknown>;
/**
 * @summary Update a video
 */
export declare const useUpdateVideo: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateVideo>>, TError, {
        id: number;
        data: BodyType<UpdateVideoRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateVideo>>, TError, {
    id: number;
    data: BodyType<UpdateVideoRequest>;
}, TContext>;
/**
 * @summary List all niche ideas
 */
export declare const getListNichesUrl: () => string;
export declare const listNiches: (options?: RequestInit) => Promise<Niche[]>;
export declare const getListNichesQueryKey: () => readonly ["/api/niches"];
export declare const getListNichesQueryOptions: <TData = Awaited<ReturnType<typeof listNiches>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listNiches>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listNiches>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListNichesQueryResult = NonNullable<Awaited<ReturnType<typeof listNiches>>>;
export type ListNichesQueryError = ErrorType<unknown>;
/**
 * @summary List all niche ideas
 */
export declare function useListNiches<TData = Awaited<ReturnType<typeof listNiches>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listNiches>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a niche
 */
export declare const getCreateNicheUrl: () => string;
export declare const createNiche: (createNicheRequest: CreateNicheRequest, options?: RequestInit) => Promise<Niche>;
export declare const getCreateNicheMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createNiche>>, TError, {
        data: BodyType<CreateNicheRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createNiche>>, TError, {
    data: BodyType<CreateNicheRequest>;
}, TContext>;
export type CreateNicheMutationResult = NonNullable<Awaited<ReturnType<typeof createNiche>>>;
export type CreateNicheMutationBody = BodyType<CreateNicheRequest>;
export type CreateNicheMutationError = ErrorType<unknown>;
/**
 * @summary Create a niche
 */
export declare const useCreateNiche: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createNiche>>, TError, {
        data: BodyType<CreateNicheRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createNiche>>, TError, {
    data: BodyType<CreateNicheRequest>;
}, TContext>;
/**
 * @summary Get upcoming upload schedule
 */
export declare const getGetScheduleUrl: () => string;
export declare const getSchedule: (options?: RequestInit) => Promise<ScheduleEntry[]>;
export declare const getGetScheduleQueryKey: () => readonly ["/api/schedule"];
export declare const getGetScheduleQueryOptions: <TData = Awaited<ReturnType<typeof getSchedule>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSchedule>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSchedule>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetScheduleQueryResult = NonNullable<Awaited<ReturnType<typeof getSchedule>>>;
export type GetScheduleQueryError = ErrorType<unknown>;
/**
 * @summary Get upcoming upload schedule
 */
export declare function useGetSchedule<TData = Awaited<ReturnType<typeof getSchedule>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSchedule>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get earnings overview
 */
export declare const getGetEarningsUrl: () => string;
export declare const getEarnings: (options?: RequestInit) => Promise<EarningsOverview>;
export declare const getGetEarningsQueryKey: () => readonly ["/api/earnings"];
export declare const getGetEarningsQueryOptions: <TData = Awaited<ReturnType<typeof getEarnings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEarnings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getEarnings>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetEarningsQueryResult = NonNullable<Awaited<ReturnType<typeof getEarnings>>>;
export type GetEarningsQueryError = ErrorType<unknown>;
/**
 * @summary Get earnings overview
 */
export declare function useGetEarnings<TData = Awaited<ReturnType<typeof getEarnings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEarnings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get daily earnings
 */
export declare const getGetDailyEarningsUrl: () => string;
export declare const getDailyEarnings: (options?: RequestInit) => Promise<DailyEarning[]>;
export declare const getGetDailyEarningsQueryKey: () => readonly ["/api/earnings/daily"];
export declare const getGetDailyEarningsQueryOptions: <TData = Awaited<ReturnType<typeof getDailyEarnings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDailyEarnings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDailyEarnings>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDailyEarningsQueryResult = NonNullable<Awaited<ReturnType<typeof getDailyEarnings>>>;
export type GetDailyEarningsQueryError = ErrorType<unknown>;
/**
 * @summary Get daily earnings
 */
export declare function useGetDailyEarnings<TData = Awaited<ReturnType<typeof getDailyEarnings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDailyEarnings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map