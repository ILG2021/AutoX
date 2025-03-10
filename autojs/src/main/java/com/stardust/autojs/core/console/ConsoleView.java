package com.stardust.autojs.core.console;

import android.content.Context;
import android.content.res.TypedArray;

import androidx.annotation.Nullable;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.util.AttributeSet;
import android.util.Log;
import android.util.SparseArray;
import android.util.TypedValue;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.material.snackbar.Snackbar;
import com.stardust.app.GlobalAppContext;
import com.stardust.enhancedfloaty.ResizableExpandableFloatyWindow;
import com.stardust.autojs.R;
import com.stardust.util.ClipboardUtil;
import com.stardust.util.MapBuilder;
import com.stardust.util.SparseArrayEntries;
import com.stardust.util.ViewUtil;
import com.stardust.util.ViewUtils;

import java.util.ArrayList;
import java.util.Map;

/**
 * Created by Stardust on 2017/5/2.
 * <p>
 * TODO: 优化为无锁形式
 */
public class ConsoleView extends FrameLayout implements ConsoleImpl.LogListener {

    private static final Map<Integer, Integer> ATTRS = new MapBuilder<Integer, Integer>()
            .put(R.styleable.ConsoleView_color_verbose, Log.VERBOSE)
            .put(R.styleable.ConsoleView_color_debug, Log.DEBUG)
            .put(R.styleable.ConsoleView_color_info, Log.INFO)
            .put(R.styleable.ConsoleView_color_warn, Log.WARN)
            .put(R.styleable.ConsoleView_color_error, Log.ERROR)
            .put(R.styleable.ConsoleView_color_assert, Log.ASSERT)
            .build();

    static final SparseArray<Integer> COLORS = new SparseArrayEntries<Integer>()
            .entry(Log.VERBOSE, 0xdfc0c0c0)
            .entry(Log.DEBUG, 0xdfffffff)
            .entry(Log.INFO, 0xff64dd17)
            .entry(Log.WARN, 0xff2962ff)
            .entry(Log.ERROR, 0xffd50000)
            .entry(Log.ASSERT, 0xffff534e)
            .sparseArray();

    private static final int REFRESH_INTERVAL = 100;
    private SparseArray<Integer> mColors = COLORS.clone();
    private ConsoleImpl mConsole;
    private RecyclerView mLogListRecyclerView;
    private EditText mEditText;
    private Button submitButton, copyButton;
    private ResizableExpandableFloatyWindow mWindow;
    private LinearLayout mInputContainer;
    private boolean mShouldStopRefresh = false;
    private ArrayList<ConsoleImpl.LogEntry> mLogEntries = new ArrayList<>();
    private float mLogSize = -1;

    public ConsoleView(Context context) {
        super(context);
        init(null);
    }

    public ConsoleView(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        init(attrs);
    }

    public ConsoleView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init(attrs);
    }

    public void setColors(SparseArray<Integer> colors) {
        mColors = colors;
    }

    public SparseArray<Integer> getColors() {
        return mColors;
    }

    private void init(AttributeSet attrs) {
        inflate(getContext(), R.layout.console_view, this);
        if (attrs != null) {
            TypedArray typedArray = getContext().obtainStyledAttributes(attrs, R.styleable.ConsoleView);
            for (Map.Entry<Integer, Integer> attr : ATTRS.entrySet()) {
                int styleable = attr.getKey();
                int logLevel = attr.getValue();
                mColors.put(logLevel, typedArray.getColor(styleable, mColors.get(logLevel)));
            }
        }
        mLogListRecyclerView = findViewById(R.id.log_list);
        LinearLayoutManager manager = new LinearLayoutManager(getContext());
        mLogListRecyclerView.setLayoutManager(manager);
        mLogListRecyclerView.setAdapter(new Adapter());
        initEditText();
        initSubmitButton();
        initCopyButton();
    }

    private void initCopyButton() {
        copyButton = findViewById(R.id.copy);
        copyButton.setOnClickListener(v -> {
            StringBuilder output = new StringBuilder();
            for (ConsoleImpl.LogEntry entry : mConsole.getAllLogs()) {
                if (!entry.content.toString().isEmpty()) {
                    output.append(entry.content);
                    if (entry.newLine)
                        output.append("\n");
                }
            }
            ClipboardUtil.setClip(getContext(), output);
            Toast.makeText(getContext(), "内容已复制到剪贴板", Toast.LENGTH_SHORT).show();
        });
    }

    private void initSubmitButton() {
        submitButton = findViewById(R.id.submit);
        submitButton.setOnClickListener(v -> {
            CharSequence input = mEditText.getText();
            submitInput(input);
        });
    }

    private void submitInput(CharSequence input) {
        if (android.text.TextUtils.isEmpty(input)) {
            return;
        }
        if (mConsole.submitInput(input)) {
            mEditText.setText("");
        }
    }

    private void initEditText() {
        mEditText = findViewById(R.id.input);
        mEditText.setFocusableInTouchMode(true);
        mInputContainer = findViewById(R.id.input_container);
        OnClickListener listener = v -> {
            if (mWindow != null) {
                mWindow.requestWindowFocus();
                mEditText.requestFocus();
            }
        };
        mEditText.setOnClickListener(listener);
        mInputContainer.setOnClickListener(listener);
    }

    public void setConsole(ConsoleImpl console) {
        mConsole = console;
        mConsole.setConsoleView(this);
    }

    @Override
    public void onNewLog(ConsoleImpl.LogEntry logEntry) {

    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        mShouldStopRefresh = false;
        postDelayed(new Runnable() {
            @Override
            public void run() {
                refreshLog();
                if (!mShouldStopRefresh) {
                    postDelayed(this, REFRESH_INTERVAL);
                }
            }
        }, REFRESH_INTERVAL);
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        mShouldStopRefresh = true;
    }


    @Override
    public void onLogClear() {
        post(() -> {
            mLogEntries.clear();
            mLogListRecyclerView.getAdapter().notifyDataSetChanged();
        });
    }

    private void refreshLog() {
        if (mConsole == null)
            return;
        int oldSize = mLogEntries.size();
        ArrayList<ConsoleImpl.LogEntry> logEntries = mConsole.getAllLogs();
        synchronized (mConsole.getAllLogs()) {
            final int size = logEntries.size();
            if (size == 0) {
                return;
            }
            if (oldSize >= size) {
                return;
            }
            if (oldSize == 0) {
                mLogEntries.addAll(logEntries);
            } else {
                for (int i = oldSize; i < size; i++) {
                    mLogEntries.add(logEntries.get(i));
                }
            }
            mLogListRecyclerView.getAdapter().notifyItemRangeInserted(oldSize, size - 1);
            mLogListRecyclerView.scrollToPosition(size - 1);
        }
    }

    public void setWindow(ResizableExpandableFloatyWindow window) {
        mWindow = window;
    }

    public void showEditText() {
        post(() -> {
            mEditText.setVisibility(VISIBLE);
            submitButton.setVisibility(VISIBLE);
            mWindow.requestWindowFocus();
            //mInputContainer.setVisibility(VISIBLE);
            mEditText.requestFocus();
        });
    }

    public void hideEditText() {
        post(() -> {
            mEditText.setVisibility(GONE);
            submitButton.setVisibility(GONE);
        });
    }

    public void setLogSize(int size) {
        mLogSize = (int) ViewUtils.spToPx(getContext(), size);
    }


    private class ViewHolder extends RecyclerView.ViewHolder {

        TextView textView;

        public ViewHolder(View itemView) {
            super(itemView);
            textView = (TextView) itemView;
        }
    }

    private class Adapter extends RecyclerView.Adapter<ViewHolder> {

        @Override
        public ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
            return new ViewHolder(LayoutInflater.from(getContext()).inflate(R.layout.console_view_item, parent, false));
        }

        @Override
        public void onBindViewHolder(ViewHolder holder, int position) {
            ConsoleImpl.LogEntry logEntry = mLogEntries.get(position);
            holder.textView.setText(logEntry.content);
            if (mLogSize != -1) {
                holder.textView.setTextSize(TypedValue.COMPLEX_UNIT_PX, mLogSize);
            }
            holder.textView.setTextColor(mColors.get(logEntry.level));
        }

        @Override
        public int getItemCount() {
            return mLogEntries.size();
        }
    }
}
