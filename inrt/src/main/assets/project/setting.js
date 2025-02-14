
'ui';
var util_module = require('util.js');

ui.layout(<vertical>
    <appbar>
        <toolbar title="养号设置"></toolbar>
    </appbar>
    <scroll>
        <vertical padding='16'>
            <text text='注1：如非必要，参数请不要调动，默认参数基本上是比较合理的' textColor='red'></text>
            <text text='注2：养号场地目前只适配了小房子、专页和小组' textColor='red'></text>
            <text marginTop='4' text='fb帖子语言：'></text>
            <radiogroup id='rg_ocr'>
                <radio id='latin' text='拉丁语系' checked="{{util_module.storage.get('ocr_lang', 'latin') == 'latin'}}"></radio>
                <radio id='sa' text='梵语' checked="{{util_module.storage.get('ocr_lang', 'latin') == 'sa'}}"></radio>
            </radiogroup>
            <text marginTop='4' text='请输入养号表格链接：'></text>
            <horizontal>
                <input singleLine='true' id="sheet_url" layout_weight='1' />
                <button id='import_sheet'>导入</button>
            </horizontal>
            <text text='切换场地时间间隔（分钟）：'></text>
            <input inputType='number' id='field_interval' text='5'></input>
            <text text='图片/视频浏览时间（秒）'></text>
            <input inputType='number' id='browse_duration' text='15'></input>
            <text text='图片/视频打开几率（%）'></text>
            <horizontal>
                <seekbar id='open_image_probability' marginLeft='-16' layout_weight='1' max='100' progress='10'></seekbar>
                <text id='open_image_text' text='10%'></text>
            </horizontal>
            <text text='点赞几率（%）'></text>
            <horizontal>
                <seekbar id='zan_probability' marginLeft='-16' layout_weight='1' max='100' progress='30'></seekbar>
                <text id='zan_text' text='30%'></text>
            </horizontal>
            <text text='最低点赞数（高于这个值的帖子才会被点赞）'></text>
            <input inputType='number' id='lowest_zan' text='0'></input>
            <text marginTop="4" text='点赞类型（全部关闭时将不会点赞）:'></text>
            <horizontal>
                <text text='赞'></text>
                <Switch id='emoji_zan' checked='true'></Switch>
                <text text='爱心'></text>
                <Switch id='emoji_heart' checked='true'></Switch>
                <text text='抱抱'></text>
                <Switch id='emoji_hug' checked='true'></Switch>
            </horizontal>
            <horizontal gravity='center'><button id='ensure' text='确定'></button></horizontal>
        </vertical>
    </scroll>
</vertical>)

function bindEvents() {
    ui.import_sheet.click(function () {
        if (!ui.sheet_url.text()) {
            toast("请输入表格链接")
            return;
        }

        const progress = dialogs.build({
            content: "读取中...",
            progress: {
                max: -1,
            }
        }).show();

        util_module.importSheet(ui.sheet_url.text(),
            function () {
                progress.dismiss();
            }, false)
    });

    ui.field_interval.addTextChangedListener({
        afterTextChanged: (editable) => {
            util_module.storage.put('field_interval', parseInt(editable.toString()))
        }
    })

    ui.browse_duration.addTextChangedListener({
        afterTextChanged: (editable) => {
            util_module.storage.put("browse_duration", parseInt(editable.toString()))
        }
    })

    ui.open_image_probability.setOnSeekBarChangeListener({
        onProgressChanged: (seekbar, progress, fromUser) => {
            ui.open_image_text.setText(progress + "%")
            util_module.storage.put("open_image_probability", progress)
        }
    });

    /* ui.comment_probability.setOnSeekBarChangeListener({
        onProgressChanged: (seekbar, progress, fromUser) => {
            ui.comment_text.setText(progress + "%")
            util_module.storage.put("comment_probability", progress)
        }
    }); */

    ui.zan_probability.setOnSeekBarChangeListener({
        onProgressChanged: (seekbar, progress, fromUser) => {
            ui.zan_text.setText(progress + "%")
            util_module.storage.put("zan_probability", progress)
        }
    });

    ui.lowest_zan.addTextChangedListener({
        afterTextChanged: (editable) => {
            util_module.storage.put("lowest_zan", parseInt(editable.toString()))
        }
    })

    // ui.comment_enable.on('check', (checked) => {
    //     util_module.storage.put("comment_enable", checked)
    // })

    ui.emoji_zan.on('check', (checked) => {
        util_module.storage.put("emoji_zan", checked)
    })

    ui.emoji_heart.on('check', (checked) => {
        util_module.storage.put("emoji_heart", checked)
    })

    ui.emoji_hug.on('check', (checked) => {
        util_module.storage.put("emoji_hug", checked)
    })

    ui.ensure.click(() => {
        engines.myEngine().forceStop();
    })

    var listener = new android.widget.RadioGroup.OnCheckedChangeListener({
        onCheckedChanged: function (group, checkedId) {
            if (ui.latin.isChecked())
                util_module.storage.put("ocr_lang", "latin")
            else
                util_module.storage.put("ocr_lang", "sa")
        }
    })
    ui.rg_ocr.setOnCheckedChangeListener(listener)
}

bindEvents();

ui.post(() => {
    ui.sheet_url.setText(util_module.storage.get("sheet_url", ""))
    ui.field_interval.setText(util_module.storage.get('field_interval', 5) + "")
    ui.browse_duration.setText(util_module.storage.get('browse_duration', 15) + "")
    ui.open_image_probability.setProgress(util_module.storage.get('open_image_probability', 10))
    // ui.comment_probability.setProgress(util_module.storage.get('comment_probability', 10))
    ui.zan_probability.setProgress(util_module.storage.get('zan_probability', 30))
    ui.lowest_zan.setText(util_module.storage.get('lowest_zan', 0) + "")
    // ui.comment_enable.setChecked(util_module.storage.get('comment_enable', true))
    ui.emoji_zan.setChecked(util_module.storage.get('emoji_zan', true))
    ui.emoji_heart.setChecked(util_module.storage.get('emoji_heart', true))
    ui.emoji_hug.setChecked(util_module.storage.get('emoji_hug', true))
})

setInterval(() => { }, 1000);