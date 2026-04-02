/**
 * @file fix-imports.cjs
 * @description codegen v5 adds imported type that Vite can't resolve. Until
 * versions that will fix the issue this simple fix will replace it.
 * Also ensures fragment-masking.ts exists (newer client-preset stopped generating it).
*/
const fs = require('fs');
const path = require('path');

const generatedDir = path.join(__dirname, 'src', 'lib', 'graphql', 'generated');
const graphqlFile = path.join(generatedDir, 'graphql.ts');
const fragmentMaskingFile = path.join(generatedDir, 'fragment-masking.ts');

try {
	if (!fs.existsSync(graphqlFile)) {
		return;
	}

	// Ensure fragment-masking.ts exists (newer client-preset no longer generates it)
	if (!fs.existsSync(fragmentMaskingFile)) {
		fs.writeFileSync(
			fragmentMaskingFile,
			`/* eslint-disable */\nexport interface DocumentTypeDecoration<TResult, TVariables> {\n  __apiType?: (variables: TVariables) => TResult;\n}\n`
		);
	}

	let content = fs.readFileSync(graphqlFile, 'utf8');

	// Handle single and double quotes
	const originalContent = content;
	content = content.replace(
		/import \{ DocumentTypeDecoration \} from ['"]@graphql-typed-document-node\/core['"];/g,
		'import type { DocumentTypeDecoration } from "./fragment-masking";'
	);

	if (content !== originalContent) {
		fs.writeFileSync(graphqlFile, content);
	} else {
		if (content.includes('@graphql-typed-document-node/core')) {
			content = content.replace(
				"import { DocumentTypeDecoration } from '@graphql-typed-document-node/core';",
				'import type { DocumentTypeDecoration } from "./fragment-masking";'
			);
			fs.writeFileSync(graphqlFile, content);
		}
	}
} catch (error) {
	console.log('⚠️ Could not fix imports: ', error.message);
}
