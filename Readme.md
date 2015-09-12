jQuery.CageBind
======
jQuery CageBind is a plugin for data binding. It contains two ways. One is binding data to dom elements directly, 
and the other way is adding templates into the target dom elements with data.

Features
------
jQuery.CageBind provides the following:


- Put data into dom elements by 'cg-bind' or '{{ }}'.
- Define Templates to display data.

Getting Started
------

First of all, don't forget include the jquery.

Then:
    
    <script src="dist/jquery.cagebind.min.js"></script>


How it works
------
###Bind data to dom directly.
html:

    <div id="example">
        <h1>{{orderId}}</h1>
    
        <p>
            <span cg-bind="user.name" title="{{user.sex}}"></span>
        </p>
        <select cg-bind="user.age">
            <option value="18">18</option>
            <option value="19">19</option>
            <option value="20">20</option>
            <option value="21">21</option>
            <option value="22">22</option>
        </select>
    
        <p><strong cg-bind="orderKind"></strong></p>
    
        <p><<{{orderName}}>></p>
        <textarea cg-bind="detail"></textarea>
    </div>

javascript:

    var data = {
            user: {
                name: "test",
                age: 18,
                sex: "male"
            },
            orderId: 10001,
            orderKind: 'Book',
            orderName: 'Harry Potter',
            detail: 'This is for test.'
    };
    
    $('#example').bind({data: data});
    
###And the example of using template.

Html container:
    
    <table>
        <thead>
        <tr>
            <td>name</td>
            <td>sex</td>
            <td>age</td>
        </tr>
    </thead>
        <tbody id="exampletable"></tbody>
    </table>
    
Template:
    
    <script type="text/html" id="exampleTemplate">
        <tr>
            <td cg-bind="name"></td>
            <td cg-bind="sex"></td>
            <td cg-bind="age"></td>
        </tr>
    </script>
    
Javascript:

    list = [
        {
            name: "test",
            age: 18,
            sex: "male"
        },  {
            name: "test2",
            age: 19,
            sex: "male"
        },  {
            name: "test3",
            age: 20,
            sex: "female"
        },  {
            name: "test4",
            age: 21,
            sex: "male"
        }];
    
    $('#exampletable').bind({data: list, templateId: '#exampleTemplate', length: 3});

'length' desicde the numbers of item which can be shown in the list.