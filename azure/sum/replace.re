# Filter out JS imports
/^import/d
# Replace image references, e.g. the subscribeIcon and unsubscribeIcon
s,^<img src={\(.*\)Icon} />,![\1](assets/\1.png),
# Change some JSX styles to regular HTML
s,style={{color: "\([^"]*\)"}},style="color: \1",
# Fix internal references
s,(/story/0-anet-.*stories-\([^)]*\)--page),(#\1),
