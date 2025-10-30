#!/bin/bash

# CSV to JavaScript converter script
# Converts oracle.csv to oracle-data.js

CSV_FILE="oracle.csv"
JS_FILE="oracle-data.js"
ONLY_TEST_LOGMSE=true

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --all-metrics)
            ONLY_TEST_LOGMSE=false
            shift
            ;;
        --test-only)
            ONLY_TEST_LOGMSE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--all-metrics|--test-only]"
            echo "  --test-only     Only include testLogMSE (default)"
            echo "  --all-metrics   Include all metrics (trainLogMSE, valLogMSE, testLogMSE)"
            exit 1
            ;;
    esac
done

# Check if CSV file exists
if [ ! -f "$CSV_FILE" ]; then
    echo "Error: $CSV_FILE not found in current directory"
    exit 1
fi

echo "Converting $CSV_FILE to $JS_FILE..."
if [ "$ONLY_TEST_LOGMSE" = true ]; then
    echo "Mode: testLogMSE only (compact)"
else
    echo "Mode: all metrics"
fi

# Start the JavaScript file (compact, no comments)
echo "const oracleData=[" > "$JS_FILE"

# Skip header and process each line, only include entries ending in _10k
first_entry=true
tail -n +2 "$CSV_FILE" | while IFS=',' read -r train_logmse val_logmse test_logmse layers layer_type dataset_name; do
    # Skip entries that don't end with _10k
    if [[ ! "$dataset_name" =~ _10k$ ]]; then
        continue
    fi
    # Clean up any quotes and whitespace
    train_logmse=$(echo "$train_logmse" | tr -d ' ')
    val_logmse=$(echo "$val_logmse" | tr -d ' ')
    test_logmse=$(echo "$test_logmse" | tr -d ' ')
    layers=$(echo "$layers" | tr -d ' ')
    layer_type=$(echo "$layer_type" | tr -d ' ')
    dataset_name=$(echo "$dataset_name" | tr -d ' ')

    # Add comma separator if not first entry
    if [ "$first_entry" = true ]; then
        first_entry=false
    else
        echo -n "," >> "$JS_FILE"
    fi

    # Add JavaScript object to file (compact format)
    if [ "$ONLY_TEST_LOGMSE" = true ]; then
        echo -n "{t:$test_logmse,l:$layers,y:'$layer_type',d:'$dataset_name'}" >> "$JS_FILE"
    else
        echo -n "{tr:$train_logmse,v:$val_logmse,t:$test_logmse,l:$layers,y:'$layer_type',d:'$dataset_name'}" >> "$JS_FILE"
    fi
done

# Close the JavaScript array and add compact export
cat >> "$JS_FILE" << EOF
];if(typeof module!=='undefined'&&module.exports){module.exports={oracleData};}else if(typeof window!=='undefined'){window.oracleData=oracleData;}
EOF

echo "Conversion complete! Generated $JS_FILE"
echo "File size: $(du -h "$JS_FILE" | cut -f1)"