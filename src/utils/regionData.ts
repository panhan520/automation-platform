import { regionData } from 'element-china-area-data'
import { Country, State, City } from 'country-state-city'

export interface RegionOption {
  value: string | number
  label: string
  children?: RegionOption[]
  leaf?: boolean
  [key: string]: any
}

/**
 * 获取中国的中文名称
 */
const getChinaName = (): string => {
  return '中国'
}

/**
 * 处理直辖市数据：如果只有一个"市辖区"子项，则跳过该层级，直接显示区
 */
const processProvinceData = (province: any): RegionOption => {
  // 检查是否是直辖市且只有一个"市辖区"子项
  if (
    province.children?.length === 1 &&
    province.children[0].label === '市辖区' &&
    province.children[0].children?.length
  ) {
    // 跳过"市辖区"层级，直接将区提升为市级
    return {
      value: province.value,
      label: province.label,
      children: province.children[0].children.map((district: any) => ({
        value: district.value,
        label: district.label,
        leaf: true
      }))
    }
  }

  // 普通省份，正常处理
  return {
    value: province.value,
    label: province.label,
    children: province.children?.map((city: any) => ({
      value: city.value,
      label: city.label,
      children: city.children?.map((district: any) => ({
        value: district.value,
        label: district.label,
        leaf: true
      })),
      leaf: !city.children || city.children.length === 0
    }))
  }
}

/**
 * 将中国的省市区数据转换为国家-省-市-区的格式
 */
const getChinaRegionData = (): RegionOption => {
  return {
    value: 'CN',
    label: getChinaName(),
    children: regionData.map(processProvinceData)
  }
}

/**
 * 获取所有国家数据（第一级）
 * 如果国家没有州/省数据，则标记为叶子节点
 */
export const getAllCountries = (): RegionOption[] => {
  const countries = Country.getAllCountries()
  const chinaData = getChinaRegionData()

  // 将中国放在第一位
  const otherCountries = countries
    .filter((c) => c.isoCode !== 'CN')
    .map((c) => {
      // 检查是否有州/省数据
      const states = State.getStatesOfCountry(c.isoCode)
      const hasStates = states.length > 0

      return {
        value: c.isoCode,
        label: c.name,
        leaf: !hasStates // 如果没有州/省数据，则标记为叶子节点
      }
    })

  return [chinaData, ...otherCountries]
}

/**
 * 懒加载：根据国家代码获取省/州数据（第二级）
 */
export const getStatesByCountry = (countryCode: string): RegionOption[] => {
  // 中国使用 element-china-area-data 的数据
  if (countryCode === 'CN') {
    const chinaData = getChinaRegionData()
    return chinaData.children || []
  }

  // 其他国家使用 country-state-city
  const states = State.getStatesOfCountry(countryCode)
  return states.map((s) => {
    // 检查是否有城市数据
    const cities = City.getCitiesOfState(countryCode, s.isoCode)
    return {
      value: s.isoCode,
      label: s.name,
      leaf: cities.length === 0 // 如果没有城市数据，则标记为叶子节点
    }
  })
}

/**
 * 懒加载：根据国家代码和省/州代码获取城市数据（第三级）
 */
export const getCitiesByState = (countryCode: string, stateCode: string): RegionOption[] => {
  // 中国使用 element-china-area-data 的数据
  if (countryCode === 'CN') {
    const province = regionData.find((p) => p.value === stateCode)
    if (!province) return []

    // 处理直辖市：如果只有一个"市辖区"，则直接返回区数据
    if (
      province.children?.length === 1 &&
      province.children[0].label === '市辖区' &&
      province.children[0].children?.length
    ) {
      return province.children[0].children.map((district: any) => ({
        value: district.value,
        label: district.label,
        leaf: true
      }))
    }

    // 普通省份，正常处理
    if (province.children) {
      return province.children.map((city: any) => ({
        value: city.value,
        label: city.label,
        children: city.children?.map((district: any) => ({
          value: district.value,
          label: district.label,
          leaf: true
        })),
        leaf: !city.children || city.children.length === 0
      }))
    }
    return []
  }

  // 其他国家使用 country-state-city
  const cities = City.getCitiesOfState(countryCode, stateCode)
  return cities.map((c) => ({
    value: c.name,
    label: c.name,
    leaf: true
  }))
}

/**
 * 懒加载：根据国家代码、省/州代码和市代码获取区/县数据（第四级，仅中国）
 */
export const getDistrictsByCity = (
  countryCode: string,
  stateCode: string,
  cityCode: string
): RegionOption[] => {
  // 只有中国有第四级（区/县）
  if (countryCode === 'CN') {
    const province = regionData.find((p) => p.value === stateCode)
    if (province && province.children) {
      const city = province.children.find((c) => c.value === cityCode)
      if (city && city.children) {
        return city.children.map((district) => ({
          value: district.value,
          label: district.label,
          leaf: true
        }))
      }
    }
  }
  return []
}
