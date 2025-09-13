import { useState, useEffect, useCallback } from 'react'
import { Post, PostsResponse, PostResponse, RepliesResponse, LikeResponse, CreatePostData, CreateReplyData } from '@/types/social'

interface UseSocialPostsOptions {
  userId: string
  autoFetch?: boolean
  refreshInterval?: number // 自动刷新间隔（毫秒）
  filterByAuthor?: string // 可选：按作者ID过滤帖子
}

interface UseSocialPostsReturn {
  posts: Post[]
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  pagination: {
    page: number
    totalPages: number
    hasNextPage: boolean
  }
  
  // 操作函数
  fetchPosts: (page?: number, sortBy?: string) => Promise<void>
  createPost: (postData: CreatePostData) => Promise<Post | null>
  likePost: (postId: string) => Promise<boolean>
  refreshPosts: () => Promise<void>
  loadMorePosts: () => Promise<void>
}

export function useSocialPosts(options: UseSocialPostsOptions): UseSocialPostsReturn {
  const { userId, autoFetch = true, refreshInterval = 30000, filterByAuthor } = options
  
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    hasNextPage: false
  })

  // 获取帖子列表
  const fetchPosts = useCallback(async (page = 1, sortBy = 'latest') => {
    try {
      if (page === 1) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }
      setError(null)

      // 构建查询参数
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy
      })
      
      // 如果有作者过滤，添加到查询参数
      console.log("🔍 [useSocialPosts] filterByAuthor:", filterByAuthor)
      if (filterByAuthor) {
        queryParams.append('authorId', filterByAuthor)
        console.log('🎯 [useSocialPosts] 按作者过滤帖子:', { filterByAuthor, queryString: queryParams.toString() })
      } else {
        console.log('📝 [useSocialPosts] 获取所有帖子，无作者过滤')
      }
      
      const response = await fetch(`/api/posts?${queryParams.toString()}`)
      const data: PostsResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch posts')
      }

      if (data.data) {
        const { posts: newPosts, pagination: newPagination } = data.data
        
        if (page === 1) {
          setPosts(newPosts)
        } else {
          setPosts(prev => [...prev, ...newPosts])
        }

        setPagination({
          page: newPagination.page,
          totalPages: newPagination.totalPages,
          hasNextPage: newPagination.hasNextPage
        })
      }

    } catch (err) {
      console.error('Error fetching posts:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch posts')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [filterByAuthor, userId, autoFetch])

  // 创建新帖子
  const createPost = useCallback(async (postData: CreatePostData): Promise<Post | null> => {
    try {
      const response = await fetch(`/api/posts?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      })

      const data: PostResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create post')
      }

      // 将新帖子添加到列表顶部
      if (data.data) {
        const newPost = data.data
        setPosts(prev => [newPost, ...prev])
        return newPost
      }
      return null

    } catch (err) {
      console.error('Error creating post:', err)
      setError(err instanceof Error ? err.message : 'Failed to create post')
      return null
    }
  }, [userId])

  // 点赞/取消点赞帖子
  const likePost = useCallback(async (postId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/posts/${postId}/like?userId=${userId}`, {
        method: 'POST'
      })

      const data: LikeResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle like')
      }

      // 更新本地帖子状态
      if (data.data) {
        const { likeCount, isLiked } = data.data
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                likeCount,
                isLiked 
              }
            : post
        ))
      }

      return true

    } catch (err) {
      console.error('Error toggling like:', err)
      setError(err instanceof Error ? err.message : 'Failed to toggle like')
      return false
    }
  }, [userId])

  // 刷新帖子列表
  const refreshPosts = useCallback(async () => {
    await fetchPosts(1, 'latest')
  }, [fetchPosts])

  // 加载更多帖子
  const loadMorePosts = useCallback(async () => {
    if (pagination.hasNextPage && !isRefreshing) {
      await fetchPosts(pagination.page + 1, 'latest')
    }
  }, [pagination.hasNextPage, pagination.page, isRefreshing]) // 移除fetchPosts依赖以避免过度更新

  // 初始化获取帖子
  useEffect(() => {
    if (autoFetch && userId) {
      // 如果需要按作者过滤，等待filterByAuthor有值才获取
      if (options.filterByAuthor !== undefined) {
        // 需要过滤但filterByAuthor还是undefined，不获取
        if (filterByAuthor === undefined) {
          console.log('🔄 [useSocialPosts] 等待filterByAuthor参数...')
          return
        }
      }
      fetchPosts()
    }
  }, [autoFetch, userId, filterByAuthor]) // 移除fetchPosts和options.filterByAuthor以避免循环

  // 定时刷新 - 临时禁用以修复性能问题
  useEffect(() => {
    console.log('🚫 [useSocialPosts] 定时刷新已临时禁用以修复性能问题')
    // if (!refreshInterval || !userId) return
    //
    // const interval = setInterval(() => {
    //   // 静默刷新，检查是否有新帖子
    //   fetch(`/api/posts?page=1&limit=1&sortBy=latest`)
    //     .then(response => response.json())
    //     .then((data: PostsResponse) => {
    //       if (data.success && data.data && data.data.posts.length > 0) {
    //         const latestPost = data.data.posts[0]
    //         // 使用ref来避免依赖posts状态
    //         setPosts(currentPosts => {
    //           if (currentPosts.length === 0 || currentPosts[0].id !== latestPost.id) {
    //             // 触发刷新，但不依赖refreshPosts函数
    //             fetchPosts(1, 'latest')
    //           }
    //           return currentPosts
    //         })
    //       }
    //     })
    //     .catch(err => {
    //       console.error('Background refresh failed:', err)
    //     })
    // }, refreshInterval)
    //
    // return () => clearInterval(interval)
  }, [refreshInterval, userId, fetchPosts]) // 移除posts和refreshPosts依赖

  return {
    posts,
    isLoading,
    isRefreshing,
    error,
    pagination,
    fetchPosts,
    createPost,
    likePost,
    refreshPosts,
    loadMorePosts
  }
}