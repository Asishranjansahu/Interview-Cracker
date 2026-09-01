# Prompt design

The master prompt merges profile context, question type, and interview mode into a single structured instruction. The server route calls the prompt builder, then the model, and falls back to local coaching if the model cannot respond.
