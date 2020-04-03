import React from 'react';
import Sku from "./Sku";
import Axios from 'axios'


// 商品属性数据
import attributes from './testData/attributes';
// 商品库存数据
import stocks from './testData/stocks';

class App extends React.PureComponent {
    constructor(props){
        super(props);
        this.state = {
            sku_attribute_option: [],
            sku: [],
            image:''
        }
    }

    componentDidMount() {
        const _this = this;
        Axios.get('http://poetry.jishuai.xyz/product/show?product_id=8')
            .then(function (response) {
                _this.setState({
                    sku_attribute_option: response.data.result.sku_attribute_option,
                    sku: response.data.result.sku,
                    image:response.data.result.avatar
                })
            })
            .catch(function (error) {
                console.log(error);
            });
    }

    render() {
        return (
            <Sku {...this.state} />
        );
    }
}

export default App;
