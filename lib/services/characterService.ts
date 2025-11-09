/**
 * 角色形象服务
 * 统一管理角色数据的获取和验证
 */

export interface Character {
  id: string
  name: string
  displayName: string
  description: string | null
  imageUrl: string
  frameWidth: number
  frameHeight: number
  totalFrames: number
  isCompactFormat: boolean
  price: number
  isDefault: boolean
  sortOrder: number
}

export interface CharacterListResponse {
  success: boolean
  data: Character[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

/**
 * 获取可用角色列表
 */
export async function getAvailableCharacters(params?: {
  page?: number
  pageSize?: number
  priceMax?: number
}): Promise<CharacterListResponse> {
  const queryParams = new URLSearchParams()

  if (params?.page) queryParams.set('page', params.page.toString())
  if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString())
  if (params?.priceMax) queryParams.set('priceMax', params.priceMax.toString())

  const response = await fetch(`/api/characters?${queryParams}`)

  if (!response.ok) {
    throw new Error('Failed to fetch characters')
  }

  return response.json()
}

/**
 * 获取角色详情（通过名称）
 */
export async function getCharacterByName(name: string): Promise<Character | null> {
  try {
    const { data } = await getAvailableCharacters({ pageSize: 1000 })
    return data.find(char => char.name === name) || null
  } catch (error) {
    console.error('Failed to get character by name:', error)
    return null
  }
}

/**
 * 验证角色是否可用
 */
export async function validateCharacter(name: string): Promise<boolean> {
  const character = await getCharacterByName(name)
  return character !== null
}

/**
 * 获取随机角色（用于临时玩家）
 */
export async function getRandomCharacter(): Promise<Character> {
  try {
    const { data } = await getAvailableCharacters({ pageSize: 1000 })

    if (data.length === 0) {
      throw new Error('No characters available')
    }

    // 优先选择默认角色
    const defaultCharacters = data.filter(char => char.isDefault)
    if (defaultCharacters.length > 0) {
      return defaultCharacters[Math.floor(Math.random() * defaultCharacters.length)]
    }

    // 否则随机选择一个
    return data[Math.floor(Math.random() * data.length)]
  } catch (error) {
    console.error('Failed to get random character:', error)
    // 如果API失败，返回一个默认值
    return {
      id: 'fallback',
      name: 'hangli',
      displayName: '默认角色',
      description: null,
      imageUrl: '/assets/characters/hangli.png',
      frameWidth: 48,
      frameHeight: 48,
      totalFrames: 8,
      isCompactFormat: true,
      price: 0,
      isDefault: true,
      sortOrder: 0,
    }
  }
}

/**
 * 获取所有角色名称列表（用于Phaser预加载）
 */
export async function getAllCharacterNames(): Promise<string[]> {
  try {
    const { data } = await getAvailableCharacters({ pageSize: 1000 })
    return data.map(char => char.name)
  } catch (error) {
    console.error('Failed to get character names:', error)
    return []
  }
}

/**
 * 获取角色配置信息（用于Phaser）
 */
export async function getCharacterConfigs(): Promise<Map<string, {
  isCompactFormat: boolean
  totalFrames: number
  frameWidth: number
  frameHeight: number
}>> {
  try {
    const { data } = await getAvailableCharacters({ pageSize: 1000 })
    return new Map(
      data.map(char => [
        char.name,
        {
          isCompactFormat: char.isCompactFormat,
          totalFrames: char.totalFrames,
          frameWidth: char.frameWidth,
          frameHeight: char.frameHeight,
        }
      ])
    )
  } catch (error) {
    console.error('Failed to get character configs:', error)
    return new Map()
  }
}
