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
 * 香港区中文映射表（使用英文名称作为key）
 */
const hongKongDistrictMap: Record<string, string> = {
  'Central and Western District': '中西区',
  Eastern: '东区',
  'Islands District': '离岛区',
  'Kowloon City': '九龙城区',
  'Kwai Tsing': '葵青区',
  'Kwun Tong': '观塘区',
  North: '北区',
  'Sai Kung District': '西贡区',
  'Sha Tin': '沙田区',
  'Sham Shui Po': '深水埗区',
  Southern: '南区',
  'Tsuen Wan District': '荃湾区',
  'Tuen Mun': '屯门区',
  'Wan Chai': '湾仔区',
  'Wong Tai Sin': '黄大仙区',
  'Yau Tsim Mong': '油尖旺区',
  'Yuen Long District': '元朗区'
}

/**
 * 获取香港区的中文名称
 */
const getHongKongDistrictName = (name: string): string => {
  return hongKongDistrictMap[name] || name
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
 * 获取香港数据
 */
const getHongKongData = (): RegionOption | null => {
  const states = State.getStatesOfCountry('HK')
  // 如果 country-state-city 没有香港的州/省数据，使用手动定义的数据
  if (states.length === 0) {
    // 香港的17个区（按用户提供的顺序）
    const hongKongDistricts = [
      'Central and Western District',
      'Eastern',
      'Islands District',
      'Kowloon City',
      'Kwai Tsing',
      'Kwun Tong',
      'North',
      'Sai Kung District',
      'Sha Tin',
      'Sham Shui Po',
      'Southern',
      'Tsuen Wan District',
      'Tuen Mun',
      'Wan Chai',
      'Wong Tai Sin',
      'Yau Tsim Mong',
      'Yuen Long District'
    ]
    return {
      value: 'HK',
      label: '香港特别行政区',
      children: hongKongDistricts.map((district, index) => ({
        value: `HK-${index + 1}`,
        label: getHongKongDistrictName(district),
        leaf: true
      })),
      leaf: false
    }
  }

  // 如果有州/省数据，使用库提供的数据，并翻译为中文
  const districts = states.map((state) => {
    const cityList = City.getCitiesOfState('HK', state.isoCode)
    return {
      value: state.isoCode,
      label: getHongKongDistrictName(state.name),
      children:
        cityList.length > 0
          ? cityList.map((city) => ({
              value: city.name,
              label: getHongKongDistrictName(city.name),
              leaf: true
            }))
          : undefined,
      leaf: cityList.length === 0
    }
  })

  return {
    value: 'HK',
    label: '香港特别行政区',
    children: districts,
    leaf: false
  }
}

/**
 * 获取澳门数据
 */
const getMacauData = (): RegionOption | null => {
  const states = State.getStatesOfCountry('MO')
  // 如果 country-state-city 没有澳门的州/省数据，使用手动定义的数据
  if (states.length === 0) {
    // 澳门的7个堂区
    const macauDistricts = [
      '花地玛堂区',
      '圣安多尼堂区',
      '望德堂区',
      '大堂区',
      '风顺堂区',
      '嘉模堂区',
      '圣方济各堂区'
    ]
    return {
      value: 'MO',
      label: '澳门特别行政区',
      children: macauDistricts.map((district, index) => ({
        value: `MO-${index + 1}`,
        label: district,
        leaf: true
      })),
      leaf: false
    }
  }

  // 如果有州/省数据，使用库提供的数据
  const districts = states.map((state) => {
    const cityList = City.getCitiesOfState('MO', state.isoCode)
    return {
      value: state.isoCode,
      label: state.name,
      children:
        cityList.length > 0
          ? cityList.map((city) => ({
              value: city.name,
              label: city.name,
              leaf: true
            }))
          : undefined,
      leaf: cityList.length === 0
    }
  })

  return {
    value: 'MO',
    label: '澳门特别行政区',
    children: districts,
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
  // 添加香港到省份列表
  const hongKongData = getHongKongData()
  if (hongKongData) {
    provinces.push(hongKongData)
  }
  // 添加澳门到省份列表
  const macauData = getMacauData()
  if (macauData) {
    provinces.push(macauData)
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
  // 中国使用 element-china-area-data 的数据（包含台湾、香港、澳门）
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

    // 如果是香港
    if (stateCode === 'HK') {
      const states = State.getStatesOfCountry('HK')
      if (states.length === 0) {
        // 如果没有州/省数据，使用手动定义的香港区数据
        const hongKongDistricts = [
          'Central and Western District',
          'Eastern',
          'Islands District',
          'Kowloon City',
          'Kwai Tsing',
          'Kwun Tong',
          'North',
          'Sai Kung District',
          'Sha Tin',
          'Sham Shui Po',
          'Southern',
          'Tsuen Wan District',
          'Tuen Mun',
          'Wan Chai',
          'Wong Tai Sin',
          'Yau Tsim Mong',
          'Yuen Long District'
        ]
        return hongKongDistricts.map((district, index) => ({
          value: `HK-${index + 1}`,
          label: getHongKongDistrictName(district),
          leaf: true
        }))
      }
      // 返回香港的区数据，并翻译为中文
      return states.map((s) => {
        const cities = City.getCitiesOfState('HK', s.isoCode)
        return {
          value: s.isoCode,
          label: getHongKongDistrictName(s.name),
          children:
            cities.length > 0
              ? cities.map((c) => ({
                  value: c.name,
                  label: getHongKongDistrictName(c.name),
                  leaf: true
                }))
              : undefined,
          leaf: cities.length === 0
        }
      })
    }

    // 如果是澳门
    if (stateCode === 'MO') {
      const states = State.getStatesOfCountry('MO')
      if (states.length === 0) {
        // 如果没有州/省数据，使用手动定义的澳门区数据
        const macauDistricts = [
          '花地玛堂区',
          '圣安多尼堂区',
          '望德堂区',
          '大堂区',
          '风顺堂区',
          '嘉模堂区',
          '圣方济各堂区'
        ]
        return macauDistricts.map((district, index) => ({
          value: `MO-${index + 1}`,
          label: district,
          leaf: true
        }))
      }
      // 返回澳门的区数据
      return states.map((s) => {
        const cities = City.getCitiesOfState('MO', s.isoCode)
        return {
          value: s.isoCode,
          label: s.name,
          children:
            cities.length > 0
              ? cities.map((c) => ({
                  value: c.name,
                  label: c.name,
                  leaf: true
                }))
              : undefined,
          leaf: cities.length === 0
        }
      })
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
    // 如果是香港或澳门，它们已经是区级，不需要第四级
    if (stateCode === 'HK' || stateCode === 'MO') {
      return []
    }

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
