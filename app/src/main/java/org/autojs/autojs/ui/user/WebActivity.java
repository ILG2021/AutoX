package org.autojs.autojs.ui.user;

import android.content.Intent;
import android.webkit.WebView;

import androidx.annotation.NonNull;

import com.stardust.app.OnActivityResultDelegate;
import org.autojs.autoxjs.R;
import org.autojs.autojs.ui.BaseActivity;

import org.androidannotations.annotations.AfterViews;
import org.androidannotations.annotations.EActivity;
import org.androidannotations.annotations.ViewById;

/**
 * Created by Stardust on 2017/10/26.
 */
@EActivity(R.layout.activity_web)
public class WebActivity extends BaseActivity implements OnActivityResultDelegate.DelegateHost {

    public static final String EXTRA_URL = "url";

    private OnActivityResultDelegate.Mediator mMediator = new OnActivityResultDelegate.Mediator();

    @ViewById(R.id.eweb_view)
    WebView mEWebView;

    @AfterViews
    void setupViews() {
        setToolbarAsBack(getIntent().getStringExtra(Intent.EXTRA_TITLE));
        mEWebView.loadUrl(getIntent().getStringExtra(EXTRA_URL));
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        mMediator.onActivityResult(requestCode, resultCode, data);
    }

    @NonNull
    @Override
    public OnActivityResultDelegate.Mediator getOnActivityResultDelegateMediator() {
        return mMediator;
    }
}
