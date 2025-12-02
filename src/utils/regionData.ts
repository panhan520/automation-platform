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
 * 台湾县市中文映射表（使用英文名称作为key）
 */
const taiwanStateMap: Record<string, string> = {
  Changhua: '彰化县',
  Chiayi: '嘉义县',
  Hsinchu: '新竹县',
  Hualien: '花莲县',
  Kaohsiung: '高雄市',
  Keelung: '基隆市',
  Kinmen: '金门县',
  Lienchiang: '连江县',
  Miaoli: '苗栗县',
  Nantou: '南投县',
  'New Taipei': '新北市',
  Penghu: '澎湖县',
  Pingtung: '屏东县',
  Taichung: '台中市',
  Tainan: '台南市',
  Taipei: '台北市',
  Taitung: '台东县',
  Taoyuan: '桃园市',
  Yilan: '宜兰县',
  Yunlin: '云林县',
  'Chiayi City': '嘉义市',
  'Hsinchu City': '新竹市',
  'Chiayi County': '嘉义县',
  'Hsinchu County': '新竹县',
  'Kinmen County': '金门县',
  'Penghu County': '澎湖县',
  'Hualien City': '花莲市',
  'Taichung City': '台中市',
  'Taipei City': '台北市',
  'Taitung City': '台东市',
  'Taoyuan City': '桃园市'
}

/**
 * 台湾区/市中文映射表（使用英文名称作为key）
 */
const taiwanCityMap: Record<string, string> = {
  Changhua: '彰化',
  Yuanlin: '员林',
  Chiayi: '嘉义',
  Pizitou: '朴子头',
  'Chiayi County': '嘉义县',
  Hsinchu: '新竹',
  'Hsinchu County': '新竹县',
  Hualien: '花莲',
  'Hualien City': '花莲市',
  Kaohsiung: '高雄',
  Jincheng: '金城',
  'Kinmen County': '金门县',
  Lienchiang: '连江',
  Nangan: '南竿',
  Miaoli: '苗栗',
  Lugu: '鹿谷',
  Nantou: '南投',
  Puli: '埔里',
  'Zhongxing New Village': '中兴新村',
  Magong: '马公',
  'Penghu County': '澎湖县',
  Donggang: '东港',
  Hengchun: '恒春',
  Pingtung: '屏东',
  Taichung: '台中',
  'Taichung City': '台中市',
  Tainan: '台南',
  Yujing: '玉井',
  Banqiao: '板桥',
  Jiufen: '九份',
  Taipei: '台北',
  'Taipei City': '台北市',
  Taitung: '台东',
  'Taitung City': '台东市',
  Daxi: '大溪',
  Taoyuan: '桃园',
  'Taoyuan City': '桃园市',
  Yilan: '宜兰',
  Douliu: '斗六',
  Yunlin: '云林'
}

/**
 * 获取台湾县市的中文名称
 */
const getTaiwanStateName = (name: string): string => {
  // 优先使用name映射
  if (taiwanStateMap[name]) {
    return taiwanStateMap[name]
  }
  // 如果name包含City，尝试去掉City后映射
  if (name.includes('City')) {
    const nameWithoutCity = name.replace(' City', '')
    if (taiwanStateMap[nameWithoutCity]) {
      return taiwanStateMap[nameWithoutCity]
    }
  }
  return name
}

/**
 * 获取台湾区/市的中文名称
 */
const getTaiwanCityName = (name: string): string => {
  return taiwanCityMap[name] || name
}

/**
 * 获取台湾数据并翻译为中文
 */
const getTaiwanData = (): RegionOption | null => {
  const taiwanCountry = Country.getCountryByCode('TW')
  if (!taiwanCountry) return null

  const states = State.getStatesOfCountry('TW')
  if (states.length === 0) {
    // 如果没有州/省数据，直接返回台湾作为省份
    return {
      value: 'TW',
      label: '台湾省',
      leaf: false
    }
  }

  // 台湾的州/省数据（县市）
  const cities = states.map((state) => {
    const cityList = City.getCitiesOfState('TW', state.isoCode)
    return {
      value: state.isoCode,
      label: getTaiwanStateName(state.name),
      children: cityList.map((city) => ({
        value: city.name,
        label: getTaiwanCityName(city.name),
        leaf: true
      })),
      leaf: cityList.length === 0
    }
  })

  return {
    value: 'TW',
    label: '台湾省',
    children: cities,
    leaf: false
  }
}

/**
 * 将中国的省市区数据转换为国家-省-市-区的格式
 */
const getChinaRegionData = (): RegionOption => {
  const provinces = regionData.map(processProvinceData)
  // 添加台湾到省份列表
  const taiwanData = getTaiwanData()
  if (taiwanData) {
    provinces.push(taiwanData)
  }
  return {
    value: 'CN',
    label: getChinaName(),
    children: provinces
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
  // 中国使用 element-china-area-data 的数据（包含台湾）
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
    // 如果是台湾
    if (stateCode === 'TW') {
      const states = State.getStatesOfCountry('TW')
      const state = states.find((s) => s.isoCode === stateCode)
      if (!state) {
        // 如果找不到对应的state，可能是直接使用TW作为省份，返回所有台湾的县市
        const allStates = State.getStatesOfCountry('TW')
        return allStates.map((s) => {
          const cities = City.getCitiesOfState('TW', s.isoCode)
          return {
            value: s.isoCode,
            label: getTaiwanStateName(s.name),
            children: cities.map((c) => ({
              value: c.name,
              label: getTaiwanCityName(c.name),
              leaf: true
            })),
            leaf: cities.length === 0
          }
        })
      }
      const cities = City.getCitiesOfState('TW', stateCode)
      return cities.map((c) => ({
        value: c.name,
        label: getTaiwanCityName(c.name),
        leaf: true
      }))
    }

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
