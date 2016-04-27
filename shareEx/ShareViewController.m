//
//  ShareViewController.m
//  shareTest
//
//  Created by Lokesh Patel on 27/10/15.
//
//

#import "ShareViewController.h"

#import <MobileCoreServices/UTCoreTypes.h>

@interface ShareViewController ()
{
    NSString *userId;
    NSString *imagePath;
    NSString *entensionTitle;
    
}
@property (copy, nonatomic)NSString *entensionURL;
@property (strong, nonatomic)NSUserDefaults *mySharedDefults;

@end

static ShareViewController* shareVaribleHandle =nil;
@implementation ShareViewController
- (id)initWithNibName:(NSString*)nibNameOrNil bundle:(NSBundle*)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        // Uncomment to override the CDVCommandDelegateImpl used
        // _commandDelegate = [[MainCommandDelegate alloc] initWithViewController:self];
        // Uncomment to override the CDVCommandQueue used
        // _commandQueue = [[MainCommandQueue alloc] initWithViewController:self];
    }
    return self;
}

- (id)init
{
    self = [super init];
    if (self) {
        // Uncomment to override the CDVCommandDelegateImpl used
        // _commandDelegate = [[MainCommandDelegate alloc] initWithViewController:self];
        // Uncomment to override the CDVCommandQueue used
        // _commandQueue = [[MainCommandQueue alloc] initWithViewController:self];
    }
    return self;
}

+ (void) setShareVaribleHandle:(ShareViewController *)responder{
    shareVaribleHandle = responder;
}

//Getter method
+ (ShareViewController*) getShareVaribleHandle {
    return shareVaribleHandle;
}

+ (void) shareResult:(NSString *)error Handle:(ShareViewController *)responder
{
    if ([error isEqualToString:@"取消"]) {
        
        [[NSNotificationCenter defaultCenter] postNotificationName:@"NSExtensionHostWillDismissViewController" object:nil];
        [responder.extensionContext completeRequestReturningItems:nil completionHandler:nil];
    }
    else if (error){
        
        if ([error isEqualToString:@"发表失败，请打开故事贴重试"]) {
            
            [responder.mySharedDefults setObject:responder.entensionURL forKey:@"shareUrl"];
            
            [responder.mySharedDefults synchronize];
        }
        
        [responder showDialogWithMessage:error];
    }
    
}

- (void)didReceiveMemoryWarning
{
    // Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
    
    // Release any cached data, images, etc that aren't in use.
    [_mySharedDefults setObject:_entensionURL forKey:@"shareUrl"];
    
    [_mySharedDefults synchronize];
    
    [self showDialogWithMessage:@"导入失败，请打开故事贴重新导入"];
}

-(void)showDialogWithMessage:(NSString *)message{
    
    [self.webView removeFromSuperview];
    
    //提示框
    UIAlertController *alertController = [UIAlertController alertControllerWithTitle:@"故事贴" message:message preferredStyle:UIAlertControllerStyleAlert];
    
    UIAlertAction *okAction = [UIAlertAction actionWithTitle:@"我知道了" style:UIAlertActionStyleDefault handler:^(UIAlertAction * _Nonnull action) {
        
        [[NSNotificationCenter defaultCenter] postNotificationName:@"NSExtensionHostWillDismissViewController" object:nil];
        [self.extensionContext completeRequestReturningItems:nil completionHandler:nil];
        
    }];
    
    [alertController addAction:okAction];
    
    [self presentViewController:alertController animated:YES completion:nil];
}

#pragma mark View lifecycle
- (void)viewDidLoad
{
    [super viewDidLoad];
    
    //数据共享
    if (!_mySharedDefults) {
        
        _mySharedDefults = [[NSUserDefaults alloc] initWithSuiteName:@"group.org.hotsharetest"];
    }
    
    userId = [_mySharedDefults objectForKey:@"userId"];
    
    if (!userId || [userId isEqualToString:@""]) {
        
        [self showDialogWithMessage:@"抱歉，请先打开故事贴，并登录，才可以使用分享功能。"];
        
    }
    else{
        
        [self.webView setFrame:CGRectMake(self.webView.bounds.origin.x,self.webView.bounds.origin.y + 20,self.webView.bounds.size.width,self.webView.bounds.size.height - 20)];
        self.webView.backgroundColor = [UIColor blackColor];
        [self fetchItemDataAtBackground];
        [ShareViewController setShareVaribleHandle:self];
    }
    
    
}

-(void)fetchItemDataAtBackground{
    
    //后台获取
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSArray *inputItems = self.extensionContext.inputItems;
        NSExtensionItem *item = inputItems.firstObject;//无论多少数据，实际上只有一个 NSExtensionItem 对象
        for (NSItemProvider *provider in item.attachments) {
            //completionHandler 是异步运行的
            NSString *dataType = provider.registeredTypeIdentifiers.firstObject;//实际上一个NSItemProvider里也只有一种数据类型
            if ([dataType isEqualToString:@"public.image"]) {
                [provider loadItemForTypeIdentifier:dataType options:nil completionHandler:^(UIImage *image, NSError *error){
                    //collect image...
                    
                }];
            }else if ([dataType isEqualToString:@"public.plain-text"]){
                [provider loadItemForTypeIdentifier:dataType options:nil completionHandler:^(NSString *contentText, NSError *error){
                    //collect image...
                    
                }];
            }else if ([dataType isEqualToString:@"public.url"]){
                [provider loadItemForTypeIdentifier:dataType options:nil completionHandler:^(NSURL *url, NSError *error){
                    //collect url...
                    if (error) {
                        NSLog(@"ERROR: %@", error);
                    }
                    
                    _entensionURL = [url absoluteString];
                    
                    NSLog(@"entensionURL:%@", _entensionURL);
                    
                    [_mySharedDefults setObject:_entensionURL forKey:@"shareUrl"];
                    
                    [_mySharedDefults synchronize];
                    
                }];
            }else if ([dataType isEqualToString:@"com.apple.property-list"]){
                [provider loadItemForTypeIdentifier:dataType options:nil completionHandler:^(id<NSSecureCoding> item, NSError *error){
                    //collect url...
                    if (error) {
                        NSLog(@"ERROR: %@", error);
                    }
                    NSDictionary *results = (NSDictionary *)item;
                    
                    imagePath = [[results objectForKey: NSExtensionJavaScriptPreprocessingResultsKey ] objectForKey:@"imagePath"];
                    
                    _entensionURL = [[results objectForKey: NSExtensionJavaScriptPreprocessingResultsKey ] objectForKey:@"baseURI"];
                    
                    entensionTitle = [[results objectForKey: NSExtensionJavaScriptPreprocessingResultsKey ] objectForKey:@"title"];
                    
                }];
            }else
                NSLog(@"don't support data type: %@", dataType);
        }
    });
    
    [self performSelector:@selector(returnToJavaScriptFunction) withObject:nil afterDelay:3.0];
}


-(void) returnToJavaScriptFunction
{
    NSString *scriptCall = [NSString stringWithFormat:@"Session.set('isShareExtension', true);"];
    
    [self.commandDelegate evalJs:scriptCall];
    
}


- (void)viewDidUnload
{
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    // Return YES for supported orientations
    return [super shouldAutorotateToInterfaceOrientation:interfaceOrientation];
}


/* Comment out the block below to over-ride */

/*
 - (UIWebView*) newCordovaViewWithFrame:(CGRect)bounds
 {
 return[super newCordovaViewWithFrame:bounds];
 }
 */


@end

@implementation ShareViewCommandDelegate

/* To override the methods, uncomment the line in the init function(s)
 in MainViewController.m
 */

#pragma mark CDVCommandDelegate implementation

- (id)getCommandInstance:(NSString*)className
{
    return [super getCommandInstance:className];
}

- (NSString*)pathForResource:(NSString*)resourcepath
{
    return [super pathForResource:resourcepath];
}

@end

@implementation ShareViewCommandQueue

/* To override, uncomment the line in the init function(s)
 in MainViewController.m
 */
- (BOOL)execute:(CDVInvokedUrlCommand*)command
{
    return [super execute:command];
}

@end

