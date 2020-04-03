import React from 'react';
import {Button, Card, Toast} from 'antd-mobile';


class Sku extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            //选中内容
            selectedTemp: {
                // '内存': { attribute_id: 8, option_id: 15, option_name: '6G' },
                // '大小': { attribute_id: 2, option_id: 5, option_name: 'l' },
                // '颜色': { attribute_id: 1, option_id: 2, option_name: '蓝色' },
            },
            //所有选项与选项内容
            sku_attribute_option: [],
            //sku
            sku: [],
            //价格
            price: '',
            //库存
            stock: 0,
            //商品图片
            image: "",
            //是否选择完成
            submitAble: false,
            SKUResult: {}
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            sku_attribute_option: nextProps.sku_attribute_option,
            sku: nextProps.sku,
            image: nextProps.image,
        }, () => {
            this.initSku();
        });
    }

    initSku() {
        //所有选项
        const SKUResult = {};

        // 配置每个sku的sku选项字符串
        const data = this.state.sku.reduce((obj, currentSkuValue) => {
            const option_id_arr = currentSkuValue.lists.reduce((arr, currentListValue) => {
                arr.push(currentListValue.option.id);
                return arr;
            }, []);
            option_id_arr.sort((value1, value2) => parseInt(value1, 10) - parseInt(value2, 10));
            obj[option_id_arr.join('-')] = Object.assign({}, currentSkuValue);
            return obj;
        }, {});

        // 获取sku选项字符串的数组，库存不足需要去掉
        const skuKeys = Object.keys(data).reduce((arr, currentDataValue) => {
            if (data[currentDataValue].stock > 0) {
                arr.push(currentDataValue);
            }
            return arr;
        }, []);

        const _this = this;
        // 配置所有选项的选择情况
        skuKeys.forEach((skuKey) => {
            const skuObj = data[skuKey];

            const skuKeyArr = skuKey.split('-');
            const combArr = _this.solution(skuKeyArr);

            for (let j = 0; j < combArr.length; j++) {
                const key = combArr[j].join('-');
                if (SKUResult[key]) {
                    SKUResult[key].stock += skuObj.stock;
                    SKUResult[key].prices.push(skuObj.price);
                } else {
                    SKUResult[key] = {
                        stock: skuObj.stock,
                        prices: [skuObj.price],
                        id: [skuObj.id],
                        sku_image: '',
                    };
                }
            }
            SKUResult[skuKey] = {
                stock: skuObj.stock,
                prices: [skuObj.price],
                id: [skuObj.id],
                sku_image: skuObj.image,
            };
        });
        this.setState({
            SKUResult: SKUResult,
        }, () => {
            this.skuHandler();
        });
    }

    clickHandler(item) {
        const sku_attribute_option = this.state.sku_attribute_option;
        const selectedTemp = this.state.selectedTemp;

        sku_attribute_option.forEach((info) => {
            if (selectedTemp[info.id] && selectedTemp[info.id].option_id === item.id) {
                delete selectedTemp[info.id];
            } else {
                info.option.forEach((option) => {
                    if (option.id === item.id) {
                        // eslint-disable-next-line no-param-reassign
                        option.selected = false;
                        selectedTemp[info.id] = {};
                        selectedTemp[info.id].attribute_id = info.id;
                        selectedTemp[info.id].attribute_name = info.name;
                        selectedTemp[info.id].option_id = option.id;
                        selectedTemp[info.id].option_name = option.name;
                    }
                });
            }
        });

        this.setState({
            selectedTemp: selectedTemp
        }, () => {
            this.skuHandler()
        })
    }

    skuHandler() {
        const selectedTemp = this.state.selectedTemp || {};
        const sku_attribute_option = this.state.sku_attribute_option;
        const SKUResult = this.state.SKUResult;
        const nextState = {};

        // 根据已选中的selectedTemp，生成字典查询selectedIds
        const selectedIds = Object.keys(selectedTemp).reduce((arr, m) => {
            if (selectedTemp[m]) {
                arr.push(selectedTemp[m].option_id);
            }
            return arr;
        }, []);
        selectedIds.sort((value1, value2) => parseInt(value1, 10) - parseInt(value2, 10));

        // 处理sku_attribute_option数据，根据字典查询结果计算当前选择情况的价格范围以及总数量。
        // 并添加selected属性，用于render判断。
        sku_attribute_option.forEach((m) => {
            let selectedObjId;
            m.option.forEach((a) => {
                // eslint-disable-next-line no-param-reassign
                a.selected = !!(selectedTemp[m.id] && selectedTemp[m.id].option_id === a.id);
                if (!a.selected) {
                    let testAttrIds = [];
                    if (selectedTemp[m.id]) {
                        selectedObjId = selectedTemp[m.id].option_id;
                        for (let i = 0; i < selectedIds.length; i++) {
                            (selectedIds[i] !== selectedObjId) && testAttrIds.push(selectedIds[i]);
                        }
                    } else {
                        testAttrIds = selectedIds.concat();
                    }
                    testAttrIds = testAttrIds.concat(a.id);
                    testAttrIds.sort((value1, value2) => parseInt(value1, 10) - parseInt(value2, 10));
                    a.unselectable = !SKUResult[testAttrIds.join('-')];
                }
            });
        });

        //公共显示
        nextState.submitAble = false;
        if (SKUResult[selectedIds.join('-')]) {
            const prices = SKUResult[selectedIds.join('-')].prices;
            const max = Math.max.apply(Math, prices).toFixed(2);
            const min = Math.min.apply(Math, prices).toFixed(2);
            nextState.price = max === min ? max : `${min}~${max}`;
            if (selectedIds.length === sku_attribute_option.length) {
                nextState.submitAble = true;
                nextState.price = SKUResult[selectedIds.join('-')].prices[0];
                nextState.image = SKUResult[selectedIds.join('-')].sku_image;
            }
            nextState.stock = SKUResult[selectedIds.join('-')].stock;
        } else {
            nextState.stock = this.state.sku.reduce((stock, item) => stock + item.stock, 0);
        }
        Object.keys(nextState).length > 0 && this.setState(nextState);
    }

    solution(skuKeyArr) {
        let res = [[]];
        for (let i = 0; i < skuKeyArr.length; i++) {
            res.forEach(e => {
                res.push(e.concat(skuKeyArr[i]));
            })
        }
        //去空数组,去尾
        res = res.slice(1, -1);
        return res;
    }

    submit(confirmText) {
        Toast.info(confirmText);
    }

    render() {
        const sku_attribute_option = this.state.sku_attribute_option;
        return (
            <div>
                <Card name="Result">
                    <Card.Body>
                        <img src={this.state.image} alt="商品图片"/>
                        <p><span>价格：</span><span>{this.state.price}</span></p>
                        <p><span>库存：</span><span>{this.state.stock}</span></p>
                    </Card.Body>
                </Card>
                {
                    sku_attribute_option.map((attribute, index) =>
                        <Card name={attribute.name} key={index}
                              style={{'display': "flex", "justifyContent": "space-around"}}>
                            {attribute.name}:
                            {attribute.option.map(
                                (item, i) => {
                                    const buttonType = item.selected ? 'primary' : 'ghost';
                                    if (item.unselectable) {
                                        return <Button type={buttonType} disabled key={i} size="small"
                                                       style={{width: 100}}>{item.name}</Button>;
                                    }
                                    return <Button type={buttonType} onClick={() => this.clickHandler(item)}
                                                   size="small" style={{width: 100}}
                                                   key={i}>{item.name}</Button>;
                                },
                            )}
                        </Card>,
                    )
                }
                <Card name="Submit">
                    {
                        (() => {
                            if (!this.state.submitAble) {
                                return <Button type="ghost" disabled>不可提交</Button>;
                            }
                            const selectedTemp = this.state.selectedTemp;
                            const selectedText = Object.keys(selectedTemp).reduce((str, item) => `${str} ${selectedTemp[item].attribute_name}-${selectedTemp[item].option_name}`, '');
                            const confirmText = `你选择: ${selectedText};库存: ${this.state.stock};价格: ${this.state.price};`;
                            return (
                                <Button type="ghost" onClick={() => this.submit(confirmText)}>可提交</Button>
                            );
                        })()
                    }
                </Card>
            </div>
        );
    }
}

export default Sku;
