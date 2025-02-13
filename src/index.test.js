const Index = require('./index');
const core = require('@actions/core');
const fs = require('fs');

beforeEach(() => 
{
    // setup mock
    jest.mock('@actions/core');
    jest.spyOn(core, 'setFailed');
    jest.mock('fs');
    jest.spyOn(fs, 'readFileSync');
});

afterEach(() => 
{
    jest.clearAllMocks();
});

test('testGetProjectVersion should recognize pom.xml as valid in path and get version', async() => 
{
    var result = Index.getProjectVersion('<project><version>1.0.0</version></project>', 'pom.xml');
    expect(result).toBe('1.0.0');
});

test('testGetProjectVersion should recognize package.json as valid in path and get version', async() => 
{
    var result = Index.getProjectVersion('{"version":"1.0.0"}', 'package.json');
    expect(result).toBe('1.0.0');
});

test('testGetProjectVersion should recognize version.txt as valid in path and get version', async() => 
{
    var result = Index.getProjectVersion('1.0.0', 'version.txt');
    expect(result).toBe('1.0.0');
});

test('testGetProjectVersion should return undefined with invalid file', async() => 
{
    var result = Index.getProjectVersion('1.0.0', 'version.jar');
    expect(result).toBe(undefined);
});

test('testGetProjectVersionFromMavenFile', async() => 
{
    var result = Index.getProjectVersionFromMavenFile('<project><version>1.0.0</version></project>');
    expect(result).toBe('1.0.0');

    var fileContent = fs.readFileSync('.jest/pom.xml');
    var result2 = Index.getProjectVersionFromMavenFile(fileContent);
    expect(result2).toBe('1.0.0');
});

test('testGetProjectVersionFromPackageJsonFile', async() => 
{
    var result = Index.getProjectVersionFromPackageJsonFile('{"version":"1.0.0"}');
    expect(result).toBe('1.0.0');

    var fileContent = fs.readFileSync('.jest/package.json');
    var result2 = Index.getProjectVersionFromPackageJsonFile(fileContent);
    expect(result2).toBe('1.0.0');
});

test('testGetProjectVersionWithMavenFile', async() => 
{
    var result = Index.getProjectVersion('<project><version>1.0.0</version></project>', 'pom.xml');
    expect(result).toBe('1.0.0');

    var fileContent = fs.readFileSync('.jest/pom.xml');
    var result2 = Index.getProjectVersion(fileContent, 'pom.xml');
    expect(result2).toBe('1.0.0');
});

test('testGetProjectVersionWithMavenFileFromProperties', async() =>
{
    var fileContent = fs.readFileSync('.jest/pom-properties.xml');
    var result2 = Index.getProjectVersion(fileContent, 'pom.xml', 'test.project.version');
    expect(result2).toBe('1.2.3');
});

test('testGetProjectVersionWithPackageJsonFile', async() =>
{
    var result = Index.getProjectVersion('{"version":"1.0.0"}', 'package.json');
    expect(result).toBe('1.0.0');

    var fileContent = fs.readFileSync('.jest/package.json');
    var result2 = Index.getProjectVersion(fileContent, 'package.json');
    expect(result2).toBe('1.0.0');
});

test('testGetProjectVersionWithTxtFile', async() => 
{
    var result = Index.getProjectVersion('1.0.0', 'version.txt');
    expect(result).toBe('1.0.0');

    var fileContent = fs.readFileSync('.jest/version.txt');
    var result2 = Index.getProjectVersion(fileContent, 'version.txt');
    expect(result2).toBe('1.0.0');
});

test('testGetProjectVersionWithUnsupportedFile', async() => 
{
    var result = Index.getProjectVersion('1.0.0', 'README.md');
    expect(result).toBe(undefined);
    expect(core.setFailed).toHaveBeenCalledWith('"README.md" is not supported!');
});

it('testCheckVersionUpdateWithVersionsAreEqual', async() => 
{
    // action
    Index.checkVersionUpdate('1.0.0', '1.0.0', undefined);

    // verify
    expect(core.setFailed).toHaveBeenCalledWith('You have to update the project version!');
});

it('testCheckVersionUpdateWithVersionIsDowngraded', async() => 
{
    // action
    Index.checkVersionUpdate('1.0.0', '0.9.0', undefined);

    // verify
    expect(core.setFailed).toHaveBeenCalledWith('You have to update the project version!');
});

it('testCheckVersionUpdateWithVersionIsUpdated', async() => 
{
    // action
    Index.checkVersionUpdate('1.0.0', '1.1.0', undefined);

    // verify
    expect(core.setFailed).not.toHaveBeenCalledWith('You have to update the project version!');
});

it('testCheckVersionUpdateWithVersionIsUpdatedAndAdditionalFilesGivenButNotUpdated', async() => 
{
    // prepare
    fs.readFileSync.mockReturnValue('foo... version: 1.0.0 ...bar');

    // action
    Index.checkVersionUpdate('1.0.0', '1.1.0', ['README.md']);

    // verify
    expect(fs.readFileSync).toHaveBeenCalledWith('test/workspace/README.md');
    expect(core.setFailed).toHaveBeenCalledWith('You have to update the project version in "README.md"!');
});

it('testCheckVersionUpdateWithVersionIsUpdatedAndAdditionalFilesGiven', async() => 
{
    // prepare
    fs.readFileSync.mockReturnValue('foo... version: 1.1.0 ...bar');

    // action
    Index.checkVersionUpdate('1.0.0', '1.1.0', ['README.md']);

    // verify
    expect(fs.readFileSync).toHaveBeenCalledWith('test/workspace/README.md');
    expect(core.setFailed).not.toHaveBeenCalledWith('You have to update the project version in "README.md"!');
});

it('testCheckVersionUpdateWithVersionIsUpdatedAndAdditionalFilesGivenWithSpaceInString', async() => 
{
    // prepare
    fs.readFileSync.mockReturnValue('foo... version: 1.1.0 ...bar');

    // action
    Index.checkVersionUpdate('1.0.0', '1.1.0', [' README.md']);

    // verify
    expect(fs.readFileSync).toHaveBeenCalledWith('test/workspace/README.md');
    expect(core.setFailed).not.toHaveBeenCalledWith('You have to update the project version in "README.md"!');
});

