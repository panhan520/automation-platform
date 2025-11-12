import { regionData } from 'element-china-area-data'
import { Country, State, City } from 'country-state-city'
import i18nCountries from 'i18n-iso-countries'
import zhLocale from 'i18n-iso-countries/langs/zh.json'

// 注册中文语言包
i18nCountries.registerLocale(zhLocale)

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
 * 获取国家的中文名称
 */
const getCountryChineseName = (countryCode: string, englishName: string): string => {
  const chineseName = i18nCountries.getName(countryCode, 'zh', { select: 'official' })
  return chineseName || englishName
}

/**
 * 州/省中文翻译映射表（扩展版，包含更多常见地区）
 * 注：对于未包含的地区，将显示英文名称
 * 可以根据实际使用情况继续扩展此映射表
 */
const stateChineseMap: Record<string, Record<string, string>> = {
  US: {
    Alabama: '亚拉巴马州',
    Alaska: '阿拉斯加州',
    Arizona: '亚利桑那州',
    Arkansas: '阿肯色州',
    California: '加利福尼亚州',
    Colorado: '科罗拉多州',
    Connecticut: '康涅狄格州',
    Delaware: '特拉华州',
    Florida: '佛罗里达州',
    Georgia: '佐治亚州',
    Hawaii: '夏威夷州',
    Idaho: '爱达荷州',
    Illinois: '伊利诺伊州',
    Indiana: '印第安纳州',
    Iowa: '艾奥瓦州',
    Kansas: '堪萨斯州',
    Kentucky: '肯塔基州',
    Louisiana: '路易斯安那州',
    Maine: '缅因州',
    Maryland: '马里兰州',
    Massachusetts: '马萨诸塞州',
    Michigan: '密歇根州',
    Minnesota: '明尼苏达州',
    Mississippi: '密西西比州',
    Missouri: '密苏里州',
    Montana: '蒙大拿州',
    Nebraska: '内布拉斯加州',
    Nevada: '内华达州',
    'New Hampshire': '新罕布什尔州',
    'New Jersey': '新泽西州',
    'New Mexico': '新墨西哥州',
    'New York': '纽约州',
    'North Carolina': '北卡罗来纳州',
    'North Dakota': '北达科他州',
    Ohio: '俄亥俄州',
    Oklahoma: '俄克拉何马州',
    Oregon: '俄勒冈州',
    Pennsylvania: '宾夕法尼亚州',
    'Rhode Island': '罗得岛州',
    'South Carolina': '南卡罗来纳州',
    'South Dakota': '南达科他州',
    Tennessee: '田纳西州',
    Texas: '德克萨斯州',
    Utah: '犹他州',
    Vermont: '佛蒙特州',
    Virginia: '弗吉尼亚州',
    Washington: '华盛顿州',
    'West Virginia': '西弗吉尼亚州',
    Wisconsin: '威斯康星州',
    Wyoming: '怀俄明州',
    'District of Columbia': '哥伦比亚特区'
  },
  CA: {
    Alberta: '艾伯塔省',
    'British Columbia': '不列颠哥伦比亚省',
    Manitoba: '马尼托巴省',
    'New Brunswick': '新不伦瑞克省',
    'Newfoundland and Labrador': '纽芬兰与拉布拉多省',
    'Northwest Territories': '西北地区',
    'Nova Scotia': '新斯科舍省',
    Nunavut: '努纳武特地区',
    Ontario: '安大略省',
    'Prince Edward Island': '爱德华王子岛省',
    Quebec: '魁北克省',
    Saskatchewan: '萨斯喀彻温省',
    Yukon: '育空地区'
  },
  AU: {
    'Australian Capital Territory': '澳大利亚首都领地',
    'New South Wales': '新南威尔士州',
    'Northern Territory': '北领地',
    Queensland: '昆士兰州',
    'South Australia': '南澳大利亚州',
    Tasmania: '塔斯马尼亚州',
    Victoria: '维多利亚州',
    'Western Australia': '西澳大利亚州'
  },
  GB: {
    England: '英格兰',
    Scotland: '苏格兰',
    Wales: '威尔士',
    'Northern Ireland': '北爱尔兰'
  },
  JP: {
    Aichi: '爱知县',
    Akita: '秋田县',
    Aomori: '青森县',
    Chiba: '千叶县',
    Ehime: '爱媛县',
    Fukui: '福井县',
    Fukuoka: '福冈县',
    Fukushima: '福岛县',
    Gifu: '岐阜县',
    Gunma: '群马县',
    Hiroshima: '广岛县',
    Hokkaido: '北海道',
    Hyogo: '兵库县',
    Ibaraki: '茨城县',
    Ishikawa: '石川县',
    Iwate: '岩手县',
    Kagawa: '香川县',
    Kagoshima: '鹿儿岛县',
    Kanagawa: '神奈川县',
    Kochi: '高知县',
    Kumamoto: '熊本县',
    Kyoto: '京都府',
    Mie: '三重县',
    Miyagi: '宫城县',
    Miyazaki: '宫崎县',
    Nagano: '长野县',
    Nagasaki: '长崎县',
    Nara: '奈良县',
    Niigata: '新潟县',
    Oita: '大分县',
    Okayama: '冈山县',
    Okinawa: '冲绳县',
    Osaka: '大阪府',
    Saga: '佐贺县',
    Saitama: '埼玉县',
    Shiga: '滋贺县',
    Shimane: '岛根县',
    Shizuoka: '静冈县',
    Tochigi: '栃木县',
    Tokushima: '德岛县',
    Tokyo: '东京都',
    Tottori: '鸟取县',
    Toyama: '富山县',
    Wakayama: '和歌山县',
    Yamagata: '山形县',
    Yamaguchi: '山口县',
    Yamanashi: '山梨县'
  },
  DE: {
    'Baden-Württemberg': '巴登-符腾堡州',
    Bayern: '巴伐利亚州',
    Berlin: '柏林',
    Brandenburg: '勃兰登堡州',
    Bremen: '不来梅',
    Hamburg: '汉堡',
    Hessen: '黑森州',
    'Mecklenburg-Vorpommern': '梅克伦堡-前波莫瑞州',
    'Lower Saxony': '下萨克森州',
    'North Rhine-Westphalia': '北莱茵-威斯特法伦州',
    'Rhineland-Palatinate': '莱茵兰-普法尔茨州',
    Saarland: '萨尔州',
    Saxony: '萨克森州',
    'Saxony-Anhalt': '萨克森-安哈尔特州',
    'Schleswig-Holstein': '石勒苏益格-荷尔斯泰因州',
    Thuringia: '图林根州'
  },
  FR: {
    'Auvergne-Rhône-Alpes': '奥弗涅-罗讷-阿尔卑斯大区',
    'Bourgogne-Franche-Comté': '勃艮第-弗朗什-孔泰大区',
    Bretagne: '布列塔尼大区',
    'Centre-Val de Loire': '中央-卢瓦尔河谷大区',
    Corse: '科西嘉大区',
    'Grand Est': '大东部大区',
    'Hauts-de-France': '上法兰西大区',
    'Île-de-France': '法兰西岛大区',
    Normandie: '诺曼底大区',
    'Nouvelle-Aquitaine': '新阿基坦大区',
    Occitanie: '奥克西塔尼大区',
    'Pays de la Loire': '卢瓦尔河地区大区',
    "Provence-Alpes-Côte d'Azur": '普罗旺斯-阿尔卑斯-蓝色海岸大区'
  },
  IT: {
    Abruzzo: '阿布鲁佐大区',
    Basilicata: '巴西利卡塔大区',
    Calabria: '卡拉布里亚大区',
    Campania: '坎帕尼亚大区',
    'Emilia-Romagna': '艾米利亚-罗马涅大区',
    'Friuli-Venezia Giulia': '弗留利-威尼斯朱利亚大区',
    Lazio: '拉齐奥大区',
    Liguria: '利古里亚大区',
    Lombardia: '伦巴第大区',
    Marche: '马尔凯大区',
    Molise: '莫利塞大区',
    Piemonte: '皮埃蒙特大区',
    Puglia: '普利亚大区',
    Sardegna: '撒丁大区',
    Sicilia: '西西里大区',
    Toscana: '托斯卡纳大区',
    'Trentino-Alto Adige': '特伦蒂诺-上阿迪杰大区',
    Umbria: '翁布里亚大区',
    "Valle d'Aosta": '瓦莱达奥斯塔大区',
    Veneto: '威尼托大区'
  },
  ES: {
    Andalucía: '安达卢西亚',
    Aragón: '阿拉贡',
    Asturias: '阿斯图里亚斯',
    'Islas Baleares': '巴利阿里群岛',
    'País Vasco': '巴斯克自治区',
    'Islas Canarias': '加那利群岛',
    Cantabria: '坎塔布里亚',
    'Castilla-La Mancha': '卡斯蒂利亚-拉曼恰',
    'Castilla y León': '卡斯蒂利亚-莱昂',
    Cataluña: '加泰罗尼亚',
    'Comunidad Valenciana': '瓦伦西亚自治区',
    Extremadura: '埃斯特雷马杜拉',
    Galicia: '加利西亚',
    Madrid: '马德里',
    Murcia: '穆尔西亚',
    Navarra: '纳瓦拉',
    'La Rioja': '拉里奥哈'
  },
  BR: {
    Acre: '阿克里州',
    Alagoas: '阿拉戈斯州',
    Amapá: '阿马帕州',
    Amazonas: '亚马孙州',
    Bahia: '巴伊亚州',
    Ceará: '塞阿拉州',
    'Distrito Federal': '联邦区',
    'Espírito Santo': '圣埃斯皮里图州',
    Goiás: '戈亚斯州',
    Maranhão: '马拉尼昂州',
    'Mato Grosso': '马托格罗索州',
    'Mato Grosso do Sul': '南马托格罗索州',
    'Minas Gerais': '米纳斯吉拉斯州',
    Pará: '帕拉州',
    Paraíba: '帕拉伊巴州',
    Paraná: '巴拉那州',
    Pernambuco: '伯南布哥州',
    Piauí: '皮奥伊州',
    'Rio de Janeiro': '里约热内卢州',
    'Rio Grande do Norte': '北里奥格兰德州',
    'Rio Grande do Sul': '南里奥格兰德州',
    Rondônia: '朗多尼亚州',
    Roraima: '罗赖马州',
    'Santa Catarina': '圣卡塔琳娜州',
    'São Paulo': '圣保罗州',
    Sergipe: '塞尔希培州',
    Tocantins: '托坎廷斯州'
  },
  IN: {
    'Andhra Pradesh': '安得拉邦',
    'Arunachal Pradesh': '阿鲁纳恰尔邦',
    Assam: '阿萨姆邦',
    Bihar: '比哈尔邦',
    Chhattisgarh: '恰蒂斯加尔邦',
    Goa: '果阿邦',
    Gujarat: '古吉拉特邦',
    Haryana: '哈里亚纳邦',
    'Himachal Pradesh': '喜马偕尔邦',
    Jharkhand: '贾坎德邦',
    Karnataka: '卡纳塔克邦',
    Kerala: '喀拉拉邦',
    'Madhya Pradesh': '中央邦',
    Maharashtra: '马哈拉施特拉邦',
    Manipur: '曼尼普尔邦',
    Meghalaya: '梅加拉亚邦',
    Mizoram: '米佐拉姆邦',
    Nagaland: '那加兰邦',
    Odisha: '奥里萨邦',
    Punjab: '旁遮普邦',
    Rajasthan: '拉贾斯坦邦',
    Sikkim: '锡金邦',
    'Tamil Nadu': '泰米尔纳德邦',
    Telangana: '特伦甘纳邦',
    Tripura: '特里普拉邦',
    'Uttar Pradesh': '北方邦',
    Uttarakhand: '北阿坎德邦',
    'West Bengal': '西孟加拉邦'
  },
  RU: {
    'Altai Krai': '阿尔泰边疆区',
    'Altai Republic': '阿尔泰共和国',
    'Amur Oblast': '阿穆尔州',
    'Arkhangelsk Oblast': '阿尔汉格尔斯克州',
    'Astrakhan Oblast': '阿斯特拉罕州',
    'Belgorod Oblast': '别尔哥罗德州',
    'Bryansk Oblast': '布良斯克州',
    'Chechen Republic': '车臣共和国',
    'Chelyabinsk Oblast': '车里雅宾斯克州',
    'Chukotka Autonomous Okrug': '楚科奇自治区',
    'Chuvash Republic': '楚瓦什共和国',
    'Irkutsk Oblast': '伊尔库茨克州',
    'Ivanovo Oblast': '伊万诺沃州',
    'Jewish Autonomous Oblast': '犹太自治州',
    'Kabardino-Balkarian Republic': '卡巴尔达-巴尔卡尔共和国',
    'Kaliningrad Oblast': '加里宁格勒州',
    'Kaluga Oblast': '卡卢加州',
    'Kamchatka Krai': '堪察加边疆区',
    'Karachay-Cherkess Republic': '卡拉恰伊-切尔克斯共和国',
    'Kemerovo Oblast': '克麦罗沃州',
    'Khabarovsk Krai': '哈巴罗夫斯克边疆区',
    'Khanty-Mansi Autonomous Okrug': '汉特-曼西自治区',
    'Kirov Oblast': '基洛夫州',
    'Komi Republic': '科米共和国',
    'Kostroma Oblast': '科斯特罗马州',
    'Krasnodar Krai': '克拉斯诺达尔边疆区',
    'Krasnoyarsk Krai': '克拉斯诺亚尔斯克边疆区',
    'Kurgan Oblast': '库尔干州',
    'Kursk Oblast': '库尔斯克州',
    'Leningrad Oblast': '列宁格勒州',
    'Lipetsk Oblast': '利佩茨克州',
    'Magadan Oblast': '马加丹州',
    'Mari El Republic': '马里埃尔共和国',
    Moscow: '莫斯科',
    'Moscow Oblast': '莫斯科州',
    'Murmansk Oblast': '摩尔曼斯克州',
    'Nenets Autonomous Okrug': '涅涅茨自治区',
    'Nizhny Novgorod Oblast': '下诺夫哥罗德州',
    'Novgorod Oblast': '诺夫哥罗德州',
    'Novosibirsk Oblast': '新西伯利亚州',
    'Omsk Oblast': '鄂木斯克州',
    'Orenburg Oblast': '奥伦堡州',
    'Oryol Oblast': '奥廖尔州',
    'Penza Oblast': '奔萨州',
    'Perm Krai': '彼尔姆边疆区',
    'Primorsky Krai': '滨海边疆区',
    'Pskov Oblast': '普斯科夫州',
    'Republic of Adygea': '阿迪格共和国',
    'Republic of Bashkortostan': '巴什科尔托斯坦共和国',
    'Republic of Buryatia': '布里亚特共和国',
    'Republic of Dagestan': '达吉斯坦共和国',
    'Republic of Ingushetia': '印古什共和国',
    'Republic of Kalmykia': '卡尔梅克共和国',
    'Republic of Karelia': '卡累利阿共和国',
    'Republic of Khakassia': '哈卡斯共和国',
    'Republic of Mordovia': '莫尔多瓦共和国',
    'Republic of North Ossetia-Alania': '北奥塞梯-阿兰共和国',
    'Republic of Tatarstan': '鞑靼斯坦共和国',
    'Republic of Tuva': '图瓦共和国',
    'Rostov Oblast': '罗斯托夫州',
    'Ryazan Oblast': '梁赞州',
    'Saint Petersburg': '圣彼得堡',
    'Sakha Republic': '萨哈共和国',
    'Sakhalin Oblast': '萨哈林州',
    'Samara Oblast': '萨马拉州',
    'Saratov Oblast': '萨拉托夫州',
    'Smolensk Oblast': '斯摩棱斯克州',
    'Stavropol Krai': '斯塔夫罗波尔边疆区',
    'Sverdlovsk Oblast': '斯维尔德洛夫斯克州',
    'Tambov Oblast': '坦波夫州',
    'Tomsk Oblast': '托木斯克州',
    'Tula Oblast': '图拉州',
    'Tver Oblast': '特维尔州',
    'Tyumen Oblast': '秋明州',
    'Udmurt Republic': '乌德穆尔特共和国',
    'Ulyanovsk Oblast': '乌里扬诺夫斯克州',
    'Vladimir Oblast': '弗拉基米尔州',
    'Volgograd Oblast': '伏尔加格勒州',
    'Vologda Oblast': '沃洛格达州',
    'Voronezh Oblast': '沃罗涅日州',
    'Yamalo-Nenets Autonomous Okrug': '亚马尔-涅涅茨自治区',
    'Yaroslavl Oblast': '雅罗斯拉夫尔州',
    'Zabaykalsky Krai': '外贝加尔边疆区'
  }
}

/**
 * 获取州/省的中文名称
 */
const getStateChineseName = (countryCode: string, stateName: string): string => {
  // 检查内置映射表
  const chineseName = stateChineseMap[countryCode]?.[stateName]
  if (chineseName) return chineseName

  // 如果没有映射，返回英文名称
  return stateName
}

/**
 * 简单的城市中文翻译映射表（常见城市）
 */
const cityChineseMap: Record<string, string> = {
  'New York': '纽约',
  'Los Angeles': '洛杉矶',
  Chicago: '芝加哥',
  Houston: '休斯顿',
  Phoenix: '凤凰城',
  Philadelphia: '费城',
  'San Antonio': '圣安东尼奥',
  'San Diego': '圣地亚哥',
  Dallas: '达拉斯',
  'San Jose': '圣何塞',
  Toronto: '多伦多',
  Vancouver: '温哥华',
  Montreal: '蒙特利尔',
  Calgary: '卡尔加里',
  London: '伦敦',
  Manchester: '曼彻斯特',
  Birmingham: '伯明翰',
  Sydney: '悉尼',
  Melbourne: '墨尔本',
  Brisbane: '布里斯班',
  Tokyo: '东京',
  Osaka: '大阪',
  Kyoto: '京都',
  Yokohama: '横滨'
}

/**
 * 获取城市的中文名称
 */
const getCityChineseName = (cityName: string): string => {
  // 检查内置映射表
  const chineseName = cityChineseMap[cityName]
  if (chineseName) return chineseName

  // 如果没有映射，返回英文名称
  return cityName
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
        label: getCountryChineseName(c.isoCode, c.name),
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
    const chineseName = getStateChineseName(countryCode, s.name)
    // 检查是否有城市数据
    const cities = City.getCitiesOfState(countryCode, s.isoCode)
    return {
      value: s.isoCode,
      label: chineseName,
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
    label: getCityChineseName(c.name),
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
